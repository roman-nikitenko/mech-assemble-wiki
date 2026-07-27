import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { requireAdmin } from "../lib/auth";

// Where uploaded images live on disk — server/uploads/, next to src/.
// Resolved from THIS file's location so it works no matter which directory
// node was launched from. The folder is gitignored (binary user content
// doesn't belong in git).
export const uploadsDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Responsive variant widths (px), like WordPress's generated image sizes.
// On upload we write one WebP per width so the browser can pick the smallest
// file that fills the slot (via <img srcset> on the client). Shared with the
// backfill script and the client's srcSet() helper, which must agree.
export const VARIANT_WIDTHS = [200, 400, 800, 1200] as const;
// The stored "full" image is capped at this width — plenty for detail/hero
// views (the site's content column maxes out ~1150px) while avoiding the
// multi-megabyte originals camera/render tools produce.
export const FULL_MAX_WIDTH = 1600;

// mimetype -> extension we trust. Never trust the uploaded FILENAME for
// anything (collisions, ../ path tricks). We only use this to validate the
// upload; the files we WRITE are always WebP with names we generate.
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

// Given an /uploads path, the variant name for a width. e.g.
// "abc.webp" + 400 -> "abc-400.webp". Stripping the extension first means it
// works whether the stored base is .png/.jpg/.webp (older uploads vary).
export function variantName(baseFilename: string, width: number): string {
  const stem = baseFilename.replace(/\.[^./]+$/, "");
  return `${stem}-${width}.webp`;
}

/** Write every responsive `-<width>.webp` variant for an image whose stored
    base is `baseFilename`. Variants never upscale (withoutEnlargement) but are
    always written, so the client can reference every width unconditionally.
    Kept separate from the base write so the backfill can add variants to
    existing originals WITHOUT renaming them (their stored URLs must not move). */
export async function writeResponsiveVariants(input: Buffer, baseFilename: string): Promise<void> {
  for (const width of VARIANT_WIDTHS) {
    await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(uploadsDir, variantName(baseFilename, width)));
  }
}

/** Write the capped "full" WebP plus every responsive variant for a NEW upload.
    `stem` is the shared filename base (a uuid). Returns the base filename. */
export async function writeImageVariants(input: Buffer, stem: string): Promise<string> {
  const baseFilename = `${stem}.webp`;
  // The full image: cap the longest edge and re-encode as WebP.
  await sharp(input)
    .resize({ width: FULL_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(uploadsDir, baseFilename));
  await writeResponsiveVariants(input, baseFilename);
  return baseFilename;
}

// Buffer the upload in memory (not straight to disk) so sharp can read the
// bytes and emit our resized copies. Files stay small (5 MB cap) so this is
// cheap and avoids a temp file we'd have to clean up.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error("UNSUPPORTED_TYPE"));
  },
});

export const uploadsRouter = Router();

// POST /api/uploads — multipart form, field name "image".
// Returns the public URL of the stored (full) image; the client derives the
// responsive variant URLs from it. Invoking multer manually (instead of as
// route middleware) lets us turn its errors into our standard JSON 400s.
uploadsRouter.post("/", requireAdmin, (req, res) => {
  upload.single("image")(req, res, async (err: unknown) => {
    if (err) {
      const message =
        err instanceof Error && err.message === "UNSUPPORTED_TYPE"
          ? "Only PNG, JPEG, or WebP images are allowed."
          : err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller."
            : "Upload failed.";
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided (field name: image)." });
    }
    try {
      const baseFilename = await writeImageVariants(req.file.buffer, randomUUID());
      res.status(201).json({ url: `/uploads/${baseFilename}` });
    } catch {
      // sharp throws on corrupt/unreadable images that passed the mimetype gate.
      res.status(400).json({ error: "Could not process that image." });
    }
  });
});
