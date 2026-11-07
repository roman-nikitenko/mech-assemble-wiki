import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import sharp from "sharp";
import { requireAdmin } from "../lib/auth";
import { clearMediaUsage, findMediaUsage, type MediaUsage } from "../lib/mediaUsage";
import { uploadsDir, variantName, VARIANT_WIDTHS } from "./uploads";

// The Media library: lists, searches and deletes what's in the uploads folder.
// There is NO database table for files (a deliberate choice — the folder is the
// source of truth), so everything here is derived from the files themselves
// plus a scan of which records reference them (lib/mediaUsage.ts).

// A "base" upload is `<uuid>.<ext>`. This one pattern does three jobs:
//  - lists only real uploads (skips stray files like .DS_Store),
//  - hides the resized copies, which are `<uuid>-200.webp` etc. — after the
//    36 uuid characters they have "-200", not ".", so they don't match,
//  - validates the :name in DELETE, so "../../etc/passwd" can never reach fs.
const BASE_FILE = /^[0-9a-f-]{36}\.(webp|jpe?g|png|mp4|webm)$/;
const VIDEO_EXT = new Set([".mp4", ".webm"]);

export interface MediaItem {
  name: string;
  url: string;
  kind: "image" | "video";
  size: number;
  width: number | null;
  height: number | null;
  modifiedAt: string;
  usage: MediaUsage[];
}

interface MediaRouterDeps {
  /** Folder to manage. Injectable so tests use a temp folder, never real uploads. */
  dir?: string;
  /** Usage lookup. Injectable so file-only tests don't need the database. */
  usage?: () => Promise<Map<string, MediaUsage[]>>;
  /** Empties every record's reference to a URL (see lib/mediaUsage.ts). */
  clearUsage?: (urls: string[]) => Promise<void>;
}

export function createMediaRouter({
  dir = uploadsDir,
  usage = findMediaUsage,
  clearUsage = clearMediaUsage,
}: MediaRouterDeps = {}) {
  const router = Router();

  // GET /api/media?type=image|video|all&usage=all|used|unused&search=&sort=newest|oldest&page=1&limit=60
  // With &names=1 it skips paging and dimensions and returns just every
  // matching file's name + how many records use it (for "select all N").
  router.get("/", requireAdmin, async (req, res) => {
    const type = req.query.type === "image" || req.query.type === "video" ? req.query.type : "all";
    const usageFilter = req.query.usage === "used" || req.query.usage === "unused" ? req.query.usage : "all";
    const sort = req.query.sort === "oldest" ? "oldest" : "newest";
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(200, Math.max(1, Number.parseInt(String(req.query.limit ?? "60"), 10) || 60));

    const [names, usageByUrl] = await Promise.all([fs.promises.readdir(dir), usage()]);

    // stat() every base file for its size + date. A file can vanish between
    // readdir and stat (deleted in another tab), so a failed stat just drops it.
    const stats = await Promise.all(
      names
        .filter((n) => BASE_FILE.test(n))
        .map(async (name) => {
          try {
            const st = await fs.promises.stat(path.join(dir, name));
            return { name, size: st.size, mtimeMs: st.mtimeMs };
          } catch {
            return null;
          }
        }),
    );

    const matches = stats
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => ({
        ...s,
        kind: VIDEO_EXT.has(path.extname(s.name)) ? ("video" as const) : ("image" as const),
        usage: usageByUrl.get(`/uploads/${s.name}`) ?? [],
      }))
      .filter((s) => type === "all" || s.kind === type)
      .filter((s) => usageFilter === "all" || (usageFilter === "used") === s.usage.length > 0)
      // Search the file name OR the name/kind of any record using it — UUID file
      // names are useless to search by, so "Bob" finds the images Bob uses.
      .filter(
        (s) =>
          !search ||
          s.name.includes(search) ||
          s.usage.some((u) => u.name.toLowerCase().includes(search) || u.kind.toLowerCase().includes(search)),
      )
      // Name as tiebreaker so equal timestamps (e.g. a bulk restore) stay stable.
      .sort((a, b) => (sort === "newest" ? b.mtimeMs - a.mtimeMs : a.mtimeMs - b.mtimeMs) || a.name.localeCompare(b.name));

    const total = matches.length;

    if (req.query.names === "1") {
      return res.json({ files: matches.map((s) => ({ name: s.name, usageCount: s.usage.length })), total });
    }

    const pageRows = matches.slice((page - 1) * limit, page * limit);

    // Pixel dimensions only for the rows we return: sharp reads just the file
    // header, so 60 per request is cheap, but 500 every time would not be.
    const items: MediaItem[] = await Promise.all(
      pageRows.map(async (s) => {
        let width: number | null = null;
        let height: number | null = null;
        if (s.kind === "image") {
          try {
            const meta = await sharp(path.join(dir, s.name)).metadata();
            width = meta.width ?? null;
            height = meta.height ?? null;
          } catch {
            // unreadable image: still list it so it can be deleted
          }
        }
        return {
          name: s.name,
          url: `/uploads/${s.name}`,
          kind: s.kind,
          size: s.size,
          width,
          height,
          modifiedAt: new Date(s.mtimeMs).toISOString(),
          usage: s.usage,
        };
      }),
    );

    res.json({ items, total, page, limit });
  });

  // Deletes files + their resized copies, and empties the image field of every
  // record that used them (the records themselves are kept). Shared by the
  // single and bulk routes. Names that don't exist are skipped and counted, so
  // deleting twice (two tabs, a retry) is harmless.
  async function removeFiles(names: string[]): Promise<{ deleted: number; missing: number }> {
    const existing: string[] = [];
    for (const name of names) {
      try {
        await fs.promises.stat(path.join(dir, name));
        existing.push(name);
      } catch {
        // already gone
      }
    }
    // Clear the references FIRST, then delete the files. If the order were
    // reversed and a delete failed halfway, records would be left pointing at a
    // missing file; this way the worst case is an orphan file, which is harmless
    // and still shows up in the library to be deleted again.
    if (existing.length > 0) await clearUsage(existing.map((n) => `/uploads/${n}`));
    for (const name of existing) {
      const files = [name, ...VARIANT_WIDTHS.map((w) => variantName(name, w))];
      await Promise.all(
        files.map((f) =>
          fs.promises.unlink(path.join(dir, f)).catch((err: NodeJS.ErrnoException) => {
            // force-style: a missing variant (older upload) is fine, anything else fails.
            if (err.code !== "ENOENT") throw err;
          }),
        ),
      );
    }
    return { deleted: existing.length, missing: names.length - existing.length };
  }

  // DELETE /api/media — bulk. Body: { names: ["<uuid>.webp", ...] } (max 500).
  // Every name is validated BEFORE anything is deleted, so one bad name rejects
  // the whole request instead of deleting half of it.
  const MAX_BULK = 500;
  router.delete("/", requireAdmin, async (req, res) => {
    const names: unknown = req.body?.names;
    if (!Array.isArray(names) || names.length === 0 || names.length > MAX_BULK) {
      return res.status(400).json({ error: `Send between 1 and ${MAX_BULK} file names.` });
    }
    if (!names.every((n): n is string => typeof n === "string" && BASE_FILE.test(n))) {
      return res.status(400).json({ error: "Invalid file name." });
    }
    res.json(await removeFiles([...new Set(names)]));
  });

  // DELETE /api/media/:name — one file. The Media page shows the "Used by" list
  // and asks for confirmation first, so by the time this runs the admin has
  // seen exactly what will be cleared.
  router.delete("/:name", requireAdmin, async (req, res) => {
    const { name } = req.params;
    if (!BASE_FILE.test(name)) {
      return res.status(400).json({ error: "Invalid file name." });
    }
    const { deleted } = await removeFiles([name]);
    if (deleted === 0) return res.status(404).json({ error: "File not found." });
    res.status(204).end();
  });

  return router;
}

export const mediaRouter = createMediaRouter();
