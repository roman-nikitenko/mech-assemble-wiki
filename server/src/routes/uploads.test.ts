import { afterAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { app } from "../app";
import { uploadsDir, VARIANT_WIDTHS, variantName } from "./uploads";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };

// A real 1x1 transparent PNG — tiny but a genuinely valid image file.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const uploaded: string[] = [];
const uploadedRaw: string[] = []; // videos: single stored file, no variants

afterAll(() => {
  // remove the files these tests created — the base image plus every variant.
  for (const url of uploaded) {
    const base = path.basename(url);
    const names = [base, ...VARIANT_WIDTHS.map((w) => variantName(base, w))];
    for (const name of names) {
      const file = path.join(uploadsDir, name);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
  for (const url of uploadedRaw) {
    const file = path.join(uploadsDir, path.basename(url));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

describe("POST /api/uploads", () => {
  it("accepts a png and returns a webp url, with responsive variants written", async () => {
    const res = await request(app)
      .post("/api/uploads")
      .set(ADMIN)
      .attach("image", PNG_1PX, { filename: "pixel.png", contentType: "image/png" });
    expect(res.status).toBe(201);
    // We always re-encode to WebP, so the stored url is .webp regardless of input.
    expect(res.body.url).toMatch(/^\/uploads\/[0-9a-f-]+\.webp$/);
    uploaded.push(res.body.url);
    // ...the base file is served back
    const served = await request(app).get(res.body.url);
    expect(served.status).toBe(200);
    // ...and each responsive variant exists on disk and is served too.
    for (const w of VARIANT_WIDTHS) {
      const variantUrl = `/uploads/${variantName(path.basename(res.body.url), w)}`;
      const variant = await request(app).get(variantUrl);
      expect(variant.status).toBe(200);
    }
  });

  it("rejects a non-image file", async () => {
    const res = await request(app)
      .post("/api/uploads")
      .set(ADMIN)
      .attach("image", Buffer.from("hello"), { filename: "note.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("PNG");
  });

  it("rejects a request with no file", async () => {
    const res = await request(app).post("/api/uploads").set(ADMIN);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/uploads/video", () => {
  it("accepts an mp4 and returns its url, served back", async () => {
    const res = await request(app)
      .post("/api/uploads/video")
      .set(ADMIN)
      .attach("video", Buffer.from("fake-mp4-bytes"), { filename: "clip.mp4", contentType: "video/mp4" });
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/[0-9a-f-]+\.mp4$/);
    uploadedRaw.push(res.body.url);
    const served = await request(app).get(res.body.url);
    expect(served.status).toBe(200);
  });

  it("rejects a non-video file", async () => {
    const res = await request(app)
      .post("/api/uploads/video")
      .set(ADMIN)
      .attach("video", PNG_1PX, { filename: "pixel.png", contentType: "image/png" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("MP4");
  });

  it("requires an admin token", async () => {
    const res = await request(app)
      .post("/api/uploads/video")
      .attach("video", Buffer.from("x"), { filename: "clip.mp4", contentType: "video/mp4" });
    expect(res.status).toBe(401);
  });
});
