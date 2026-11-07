import { afterAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { createMediaRouter } from "./media";
import { clearMediaUsage, findMediaUsage, type MediaUsage } from "../lib/mediaUsage";
import { prisma } from "../lib/prisma";
import { VARIANT_WIDTHS, variantName } from "./uploads";
import { testAdminToken } from "../test/admin-token";

// These tests run the media router against a TEMP folder, never the real
// server/uploads — they list and DELETE files, so a mistake against real data
// would be unrecoverable. File-only tests also skip the database by injecting
// a fake usage lookup; one DB-backed test covers the real scan.

const ADMIN = { "x-admin-token": testAdminToken() };

// A real 1x1 PNG so sharp can read its dimensions.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// Valid uuid-shaped names (the router only accepts `<36 chars>.<ext>`).
const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png";
const C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc.mp4";

let dir: string;
let usage: Map<string, MediaUsage[]>;
// Stands in for the database clean-up in the file-only tests.
let clearUsage: ReturnType<typeof vi.fn<(urls: string[]) => Promise<void>>>;

function makeApp() {
  const app = express();
  app.use(express.json()); // the real app parses JSON bodies globally (app.ts)
  app.use("/api/media", createMediaRouter({ dir, usage: async () => usage, clearUsage }));
  return app;
}

// Write a file with a specific modified time (seconds ago) so sort order is deterministic.
function put(name: string, secondsAgo: number, bytes: Buffer = PNG_1PX) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, bytes);
  const t = new Date(Date.now() - secondsAgo * 1000);
  fs.utimesSync(file, t, t);
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "media-test-"));
  usage = new Map();
  clearUsage = vi.fn(async () => {});
  put(A, 300); // oldest
  put(B, 200);
  put(C, 100, Buffer.from("fake-mp4")); // newest
  // resized copies of A: must never show up as library items
  for (const w of VARIANT_WIDTHS) put(variantName(A, w), 300);
  put(".DS_Store", 10); // stray file: ignored
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("GET /api/media", () => {
  it("requires the admin token", async () => {
    expect((await request(makeApp()).get("/api/media")).status).toBe(401);
  });

  it("lists base files only, newest first, with size and dimensions", async () => {
    const res = await request(makeApp()).get("/api/media").set(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual([C, B, A]);
    const png = res.body.items.find((i: { name: string }) => i.name === B);
    expect(png).toMatchObject({ kind: "image", url: `/uploads/${B}`, width: 1, height: 1 });
    expect(png.size).toBe(PNG_1PX.length);
    const video = res.body.items.find((i: { name: string }) => i.name === C);
    expect(video).toMatchObject({ kind: "video", width: null, height: null });
  });

  it("sorts oldest first on request", async () => {
    const res = await request(makeApp()).get("/api/media?sort=oldest").set(ADMIN);
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual([A, B, C]);
  });

  it("filters by type", async () => {
    const images = await request(makeApp()).get("/api/media?type=image").set(ADMIN);
    expect(images.body.items.map((i: { name: string }) => i.name)).toEqual([B, A]);
    const videos = await request(makeApp()).get("/api/media?type=video").set(ADMIN);
    expect(videos.body.items.map((i: { name: string }) => i.name)).toEqual([C]);
  });

  it("paginates and reports the total", async () => {
    const res = await request(makeApp()).get("/api/media?limit=2&page=2").set(ADMIN);
    expect(res.body.total).toBe(3);
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual([A]);
  });

  it("attaches usage and searches by the name of the record using the file", async () => {
    usage.set(`/uploads/${B}`, [
      { kind: "Mech", id: "m1", name: "Bob", field: "imageUrl", editPath: "/admin/mechs/m1/edit" },
    ]);
    const all = await request(makeApp()).get("/api/media").set(ADMIN);
    expect(all.body.items.find((i: { name: string }) => i.name === B).usage).toHaveLength(1);
    expect(all.body.items.find((i: { name: string }) => i.name === A).usage).toEqual([]);

    const byOwner = await request(makeApp()).get("/api/media?search=bob").set(ADMIN);
    expect(byOwner.body.items.map((i: { name: string }) => i.name)).toEqual([B]);

    const byFile = await request(makeApp()).get("/api/media?search=aaaaaaaa").set(ADMIN);
    expect(byFile.body.items.map((i: { name: string }) => i.name)).toEqual([A]);
  });
});

describe("GET /api/media — usage filter and names mode", () => {
  beforeEach(() => {
    usage.set(`/uploads/${B}`, [
      { kind: "Mech", id: "m1", name: "Bob", field: "imageUrl", editPath: "/admin/mechs/m1/edit" },
      { kind: "Mech", id: "m1", name: "Bob", field: "iconUrl", editPath: "/admin/mechs/m1/edit" },
    ]);
  });

  it("filters to files nothing uses", async () => {
    const res = await request(makeApp()).get("/api/media?usage=unused").set(ADMIN);
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual([C, A]);
    expect(res.body.total).toBe(2);
  });

  it("filters to files that are in use", async () => {
    const res = await request(makeApp()).get("/api/media?usage=used").set(ADMIN);
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual([B]);
  });

  it("combines the usage filter with the type filter", async () => {
    const res = await request(makeApp()).get("/api/media?usage=unused&type=image").set(ADMIN);
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual([A]);
  });

  it("names mode returns every match, unpaged, with how many records use each", async () => {
    const res = await request(makeApp()).get("/api/media?names=1&limit=1").set(ADMIN);
    expect(res.body.total).toBe(3);
    expect(res.body.files).toEqual([
      { name: C, usageCount: 0 },
      { name: B, usageCount: 2 },
      { name: A, usageCount: 0 },
    ]);
    expect(res.body.items).toBeUndefined();
  });

  it("names mode respects the filters", async () => {
    const res = await request(makeApp()).get("/api/media?names=1&usage=unused").set(ADMIN);
    expect(res.body.files.map((f: { name: string }) => f.name)).toEqual([C, A]);
  });
});

describe("DELETE /api/media (bulk)", () => {
  it("requires the admin token", async () => {
    const res = await request(makeApp()).delete("/api/media").send({ names: [A] });
    expect(res.status).toBe(401);
    expect(fs.existsSync(path.join(dir, A))).toBe(true);
  });

  it("deletes every file with its resized copies and clears all their records in ONE call", async () => {
    const res = await request(makeApp()).delete("/api/media").set(ADMIN).send({ names: [A, B] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: 2, missing: 0 });
    for (const f of [A, B, ...VARIANT_WIDTHS.map((w) => variantName(A, w))]) {
      expect(fs.existsSync(path.join(dir, f)), f).toBe(false);
    }
    expect(fs.existsSync(path.join(dir, C))).toBe(true); // not requested: untouched
    expect(clearUsage).toHaveBeenCalledTimes(1);
    expect(clearUsage).toHaveBeenCalledWith([`/uploads/${A}`, `/uploads/${B}`]);
  });

  it("ignores duplicates and reports files that were already gone", async () => {
    const gone = "dddddddd-dddd-4ddd-8ddd-dddddddddddd.webp";
    const res = await request(makeApp()).delete("/api/media").set(ADMIN).send({ names: [A, A, gone] });
    expect(res.body).toEqual({ deleted: 1, missing: 1 });
    expect(clearUsage).toHaveBeenCalledWith([`/uploads/${A}`]);
  });

  it("deletes nothing at all if any name is invalid", async () => {
    const res = await request(makeApp()).delete("/api/media").set(ADMIN).send({ names: [A, "../../etc/passwd"] });
    expect(res.status).toBe(400);
    expect(fs.existsSync(path.join(dir, A))).toBe(true);
    expect(clearUsage).not.toHaveBeenCalled();
  });

  it("rejects an empty list, a non-list and a list that is too long", async () => {
    for (const body of [{ names: [] }, { names: A }, {}, { names: Array(501).fill(A) }]) {
      const res = await request(makeApp()).delete("/api/media").set(ADMIN).send(body);
      expect(res.status, JSON.stringify(body).slice(0, 30)).toBe(400);
    }
    expect(fs.existsSync(path.join(dir, A))).toBe(true);
  });

  it("does not touch the database when none of the files exist", async () => {
    await request(makeApp()).delete("/api/media").set(ADMIN).send({ names: ["dddddddd-dddd-4ddd-8ddd-dddddddddddd.webp"] });
    expect(clearUsage).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/media/:name", () => {
  it("requires the admin token", async () => {
    expect((await request(makeApp()).delete(`/api/media/${A}`)).status).toBe(401);
    expect(fs.existsSync(path.join(dir, A))).toBe(true);
  });

  it("removes the file and all of its resized copies", async () => {
    const res = await request(makeApp()).delete(`/api/media/${A}`).set(ADMIN);
    expect(res.status).toBe(204);
    expect(fs.existsSync(path.join(dir, A))).toBe(false);
    for (const w of VARIANT_WIDTHS) {
      expect(fs.existsSync(path.join(dir, variantName(A, w)))).toBe(false);
    }
    // neighbours untouched
    expect(fs.existsSync(path.join(dir, B))).toBe(true);
  });

  it("clears the records using the file BEFORE removing it from disk", async () => {
    let fileStillThereWhenCleared: boolean | null = null;
    clearUsage.mockImplementation(async () => {
      fileStillThereWhenCleared = fs.existsSync(path.join(dir, A));
    });
    expect((await request(makeApp()).delete(`/api/media/${A}`).set(ADMIN)).status).toBe(204);
    expect(clearUsage).toHaveBeenCalledWith([`/uploads/${A}`]);
    // Order matters: if clearing fails, the file must still be there to retry.
    expect(fileStillThereWhenCleared).toBe(true);
  });

  it("leaves the file in place when clearing the records fails", async () => {
    clearUsage.mockRejectedValue(new Error("db down"));
    const res = await request(makeApp()).delete(`/api/media/${A}`).set(ADMIN);
    expect(res.status).toBe(500);
    expect(fs.existsSync(path.join(dir, A))).toBe(true);
  });

  it("does not touch the database for a rejected or missing file", async () => {
    await request(makeApp()).delete("/api/media/notes.txt").set(ADMIN);
    await request(makeApp()).delete("/api/media/dddddddd-dddd-4ddd-8ddd-dddddddddddd.webp").set(ADMIN);
    expect(clearUsage).not.toHaveBeenCalled();
  });

  it("deletes a file that has no resized copies (older uploads, videos)", async () => {
    expect((await request(makeApp()).delete(`/api/media/${C}`).set(ADMIN)).status).toBe(204);
    expect(fs.existsSync(path.join(dir, C))).toBe(false);
  });

  it("returns 404 for a well-formed name that does not exist", async () => {
    const res = await request(makeApp())
      .delete("/api/media/dddddddd-dddd-4ddd-8ddd-dddddddddddd.webp")
      .set(ADMIN);
    expect(res.status).toBe(404);
  });

  it("rejects names that are not upload file names (no path tricks)", async () => {
    for (const bad of ["notes.txt", "..%2F..%2Fetc%2Fpasswd", ".DS_Store", variantName(A, 200)]) {
      const res = await request(makeApp()).delete(`/api/media/${bad}`).set(ADMIN);
      expect(res.status, bad).toBe(400);
    }
    // the stray file and the variant are still there
    expect(fs.existsSync(path.join(dir, ".DS_Store"))).toBe(true);
    expect(fs.existsSync(path.join(dir, variantName(A, 200)))).toBe(true);
  });
});

// The real usage scan against the database. Only rows with our prefix are
// created, and only those are deleted.
describe("findMediaUsage (database)", () => {
  const P = "[test:media] ";
  const url = "/uploads/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.webp";

  afterAll(async () => {
    await prisma.mech.deleteMany({ where: { name: { startsWith: P } } });
    await prisma.$disconnect();
  });

  it("finds a mech that uses a file, per column, with its edit link", async () => {
    const mech = await prisma.mech.create({
      data: { name: `${P}Bob`, rank: "Standard", imageUrl: url, iconUrl: url },
    });
    const found = (await findMediaUsage()).get(url) ?? [];
    expect(found.map((u) => u.field).sort()).toEqual(["iconUrl", "imageUrl"]);
    expect(found[0]).toMatchObject({
      kind: "Mech",
      id: mech.id,
      name: `${P}Bob`,
      editPath: `/admin/mechs/${mech.id}/edit`,
    });
  });

  it("clearMediaUsage empties only the matching fields and keeps the record", async () => {
    const other = "/uploads/ffffffff-ffff-4fff-8fff-ffffffffffff.webp";
    const mech = await prisma.mech.create({
      data: { name: `${P}Clear`, rank: "Standard", imageUrl: url, iconUrl: other, cardSkillIconUrl: url },
    });
    await clearMediaUsage([url]);
    const after = await prisma.mech.findUniqueOrThrow({ where: { id: mech.id } });
    expect(after.imageUrl).toBeNull();
    expect(after.cardSkillIconUrl).toBeNull();
    expect(after.iconUrl).toBe(other); // a different file: untouched
    expect(after.name).toBe(`${P}Clear`); // the record itself survives
  });

  it("clearMediaUsage clears several files at once and is a no-op for none", async () => {
    const u1 = "/uploads/11111111-1111-4111-8111-111111111111.webp";
    const u2 = "/uploads/22222222-2222-4222-8222-222222222222.webp";
    const keep = "/uploads/33333333-3333-4333-8333-333333333333.webp";
    const mech = await prisma.mech.create({
      data: { name: `${P}Many`, rank: "Standard", imageUrl: u1, iconUrl: u2, cardSkillIconUrl: keep },
    });
    await clearMediaUsage([]);
    expect((await prisma.mech.findUniqueOrThrow({ where: { id: mech.id } })).imageUrl).toBe(u1);
    await clearMediaUsage([u1, u2]);
    const after = await prisma.mech.findUniqueOrThrow({ where: { id: mech.id } });
    expect([after.imageUrl, after.iconUrl]).toEqual([null, null]);
    expect(after.cardSkillIconUrl).toBe(keep);
  });
});
