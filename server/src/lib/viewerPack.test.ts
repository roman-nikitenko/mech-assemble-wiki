import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { strToU8, zipSync, type Zippable } from "fflate";
import { removeViewer, unpackViewer, VIEWER_URL_RE, ViewerPackError } from "./viewerPack";

// Everything happens in a TEMP folder — never the real server/uploads.
let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "viewer-pack-"));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const zip = (files: Record<string, string>) => {
  const data: Zippable = {};
  for (const [name, text] of Object.entries(files)) data[name] = strToU8(text);
  return Buffer.from(zipSync(data));
};
const viewers = () => (fs.existsSync(path.join(dir, "viewers")) ? fs.readdirSync(path.join(dir, "viewers")) : []);
const diskPath = (url: string) => path.join(dir, url.replace("/uploads/", ""));

describe("unpackViewer", () => {
  it("unpacks the folder that holds index.html and returns its url", async () => {
    const url = await unpackViewer(
      zip({
        "mech-viewer/index.html": "<html></html>",
        "mech-viewer/assets/model.json": "{}",
        "mech-viewer/assets/stage/a.PNG": "png",
        "mech-viewer/vendor/three/three.module.js": "export {}",
        "mech-viewer/vendor/three/LICENSE": "MIT",
        // Junk a Mac adds to zips, and a file outside the viewer folder.
        "__MACOSX/mech-viewer/._index.html": "x",
        "mech-viewer/.DS_Store": "x",
        "mech-viewer/assets/._model.json": "x",
        "README.md": "not part of the viewer",
      }),
      dir,
    );
    expect(url).toMatch(VIEWER_URL_RE);
    const root = path.dirname(diskPath(url));
    expect(fs.readFileSync(diskPath(url), "utf8")).toBe("<html></html>");
    expect(fs.existsSync(path.join(root, "assets/stage/a.PNG"))).toBe(true);
    expect(fs.existsSync(path.join(root, "vendor/three/LICENSE"))).toBe(true);
    expect(fs.existsSync(path.join(root, ".DS_Store"))).toBe(false);
    expect(fs.existsSync(path.join(root, "assets/._model.json"))).toBe(false);
    expect(fs.existsSync(path.join(root, "README.md"))).toBe(false);
    expect(viewers()).toHaveLength(1); // no temp folder left behind
  });

  it("accepts index.html at the top of the zip", async () => {
    const url = await unpackViewer(zip({ "index.html": "x", "assets/a.webp": "y" }), dir);
    expect(fs.existsSync(path.join(path.dirname(diskPath(url)), "assets/a.webp"))).toBe(true);
  });

  const bad: [string, Record<string, string>, RegExp][] = [
    ["no index.html", { "a/page.html": "x" }, /index\.html/],
    ["two viewers side by side", { "a/index.html": "x", "b/index.html": "y" }, /more than one/i],
    ["a path climbing out", { "index.html": "x", "../evil.js": "y" }, /path/i],
    ["an absolute path", { "index.html": "x", "/etc/evil.js": "y" }, /path/i],
    ["a backslash path", { "index.html": "x", "a\\..\\evil.js": "y" }, /path/i],
    ["a file type we don't serve", { "index.html": "x", "run.sh": "y" }, /run\.sh/],
    [
      "too many files",
      Object.fromEntries([["index.html", "x"], ...Array.from({ length: 200 }, (_, i) => [`a/${i}.js`, "y"])]),
      /200/,
    ],
    ["a name used as both file and folder", { "index.html": "x", "a.js": "y", "a.js/b.js": "z" }, /unpack/i],
  ];
  it.each(bad)("rejects %s and leaves nothing behind", async (_label, files, message) => {
    const attempt = unpackViewer(zip(files), dir);
    await expect(attempt).rejects.toThrow(ViewerPackError);
    await expect(unpackViewer(zip(files), dir)).rejects.toThrow(message);
    expect(viewers()).toEqual([]);
  });

  it("rejects more than 40 MB unpacked (a zip bomb)", async () => {
    const bomb = Buffer.from(zipSync({ "index.html": strToU8("x"), "big.json": new Uint8Array(41 * 1024 * 1024) }));
    await expect(unpackViewer(bomb, dir)).rejects.toThrow(/40 MB/);
    expect(viewers()).toEqual([]);
  });

  it("rejects bytes that are not a zip", async () => {
    await expect(unpackViewer(Buffer.from("hello"), dir)).rejects.toThrow(ViewerPackError);
  });
});

describe("removeViewer", () => {
  it("deletes that viewer's folder only", async () => {
    const a = await unpackViewer(zip({ "index.html": "a" }), dir);
    const b = await unpackViewer(zip({ "index.html": "b" }), dir);
    await removeViewer(a, dir);
    expect(fs.existsSync(diskPath(a))).toBe(false);
    expect(fs.existsSync(diskPath(b))).toBe(true);
  });

  it("ignores any url that is not exactly a viewer url", async () => {
    fs.writeFileSync(path.join(dir, "keep.webp"), "x");
    const url = await unpackViewer(zip({ "index.html": "a" }), dir);
    for (const foreign of ["/uploads/keep.webp", "/uploads/viewers/../index.html", "/uploads/viewers/", ""]) {
      await removeViewer(foreign, dir);
    }
    expect(fs.existsSync(path.join(dir, "keep.webp"))).toBe(true);
    expect(fs.existsSync(diskPath(url))).toBe(true);
  });
});
