// A "viewer pack" is a finished static mini-site (index.html + textures + three.js)
// showing one mech in 3D. The admin uploads it as a zip; we unpack it into
// uploads/viewers/<uuid>/ and the mech stores the url of its index.html.
//
// Unpacking someone's zip is risky, so everything is checked BEFORE a byte is
// written: paths that climb out of the folder ("zip slip"), file types we don't
// want to serve, and huge unpacked sizes ("zip bomb"). The files are still web
// code running on our own origin — only the admin may upload, and only packs
// they trust.

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { unzipSync, type UnzipFileInfo } from "fflate";

export const VIEWER_URL_RE =
  /^\/uploads\/viewers\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/index\.html$/;

const MAX_FILES = 200;
const MAX_UNPACKED = 40 * 1024 * 1024; // 40 MB
const ALLOWED_EXT = new Set([".html", ".js", ".json", ".css", ".webp", ".png", ".jpg", ".jpeg"]);

/** A problem with the pack itself; the message is shown to the admin as-is. */
export class ViewerPackError extends Error {}

// Folder entries and the hidden files macOS adds when zipping.
const isJunk = (name: string) =>
  name.endsWith("/") || name.split("/").some((part) => part === "__MACOSX" || part.startsWith("._") || part === ".DS_Store");

const isUnsafe = (name: string) => name.startsWith("/") || name.includes("\\") || name.split("/").includes("..");

function listEntries(zip: Uint8Array): UnzipFileInfo[] {
  const entries: UnzipFileInfo[] = [];
  // `filter` returning false means nothing is decompressed: this only reads the index.
  unzipSync(zip, { filter: (file) => (entries.push(file), false) });
  return entries;
}

/** The files to extract, keyed by their name in the zip -> path inside the viewer. */
function plan(entries: UnzipFileInfo[]): Map<string, string> {
  if (entries.some((e) => isUnsafe(e.name))) throw new ViewerPackError("The zip contains an unsafe file path.");
  const files = entries.filter((e) => !isJunk(e.name));

  // The viewer's root is the folder holding the shallowest index.html
  // (zips usually wrap everything in one folder, e.g. mech-viewer/).
  const depth = (name: string) => name.split("/").length;
  const pages = files.filter((e) => e.name.split("/").pop() === "index.html").sort((a, b) => depth(a.name) - depth(b.name));
  if (pages.length === 0) throw new ViewerPackError("The zip has no index.html.");
  if (pages.length > 1 && depth(pages[1].name) === depth(pages[0].name)) {
    throw new ViewerPackError("The zip holds more than one viewer (several index.html files).");
  }
  const root = pages[0].name.slice(0, -"index.html".length);

  const inside = files.filter((e) => e.name.startsWith(root));
  if (inside.length > MAX_FILES) throw new ViewerPackError(`A viewer can have at most ${MAX_FILES} files.`);
  // originalSize is also the size of the buffer fflate inflates into, so an entry
  // that understates it cannot expand past what we counted here.
  if (inside.reduce((sum, e) => sum + e.originalSize, 0) > MAX_UNPACKED) {
    throw new ViewerPackError("The viewer is larger than 40 MB unpacked.");
  }

  const wanted = new Map<string, string>();
  for (const e of inside) {
    const relative = e.name.slice(root.length);
    const file = relative.split("/").pop()!;
    if (file !== "LICENSE" && !ALLOWED_EXT.has(path.extname(file).toLowerCase())) {
      throw new ViewerPackError(`File type not allowed in a viewer: ${relative}`);
    }
    wanted.set(e.name, relative);
  }
  return wanted;
}

/** Unpacks the zip under <uploadsDir>/viewers/ and returns the viewer's url.
    Throws ViewerPackError; nothing is left on disk when it does. */
export async function unpackViewer(zip: Uint8Array, uploadsDir: string): Promise<string> {
  let wanted: Map<string, string>;
  let contents: Record<string, Uint8Array>;
  try {
    wanted = plan(listEntries(zip));
    contents = unzipSync(zip, { filter: (file) => wanted.has(file.name) });
  } catch (err) {
    if (err instanceof ViewerPackError) throw err;
    throw new ViewerPackError("That file could not be read as a zip.");
  }

  const id = randomUUID();
  const viewersDir = path.join(uploadsDir, "viewers");
  // Write beside the final place and rename at the end, so a half-written viewer
  // is never reachable under its real name.
  const temp = path.join(viewersDir, `.tmp-${id}`);
  try {
    for (const [name, relative] of wanted) {
      const target = path.join(temp, relative);
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await fs.promises.writeFile(target, contents[name]);
    }
    await fs.promises.rename(temp, path.join(viewersDir, id));
  } catch {
    await fs.promises.rm(temp, { recursive: true, force: true });
    throw new ViewerPackError("Could not unpack that viewer.");
  }
  return `/uploads/viewers/${id}/index.html`;
}

/** Deletes one viewer's folder. Anything that is not a viewer url is ignored. */
export async function removeViewer(url: string, uploadsDir: string): Promise<void> {
  const id = VIEWER_URL_RE.exec(url)?.[1];
  if (id) await fs.promises.rm(path.join(uploadsDir, "viewers", id), { recursive: true, force: true });
}
