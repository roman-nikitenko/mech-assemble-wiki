import { afterAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { app } from "../app";
import { uploadsDir } from "./uploads";

// A real 1x1 transparent PNG — tiny but a genuinely valid image file.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const uploaded: string[] = [];

afterAll(() => {
  // remove files these tests created
  for (const url of uploaded) {
    const file = path.join(uploadsDir, path.basename(url));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

describe("POST /api/uploads", () => {
  it("accepts a png and returns its public url", async () => {
    const res = await request(app)
      .post("/api/uploads")
      .attach("image", PNG_1PX, { filename: "pixel.png", contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    uploaded.push(res.body.url);
    // ...and the file is actually served back
    const served = await request(app).get(res.body.url);
    expect(served.status).toBe(200);
  });

  it("rejects a non-image file", async () => {
    const res = await request(app)
      .post("/api/uploads")
      .attach("image", Buffer.from("hello"), { filename: "note.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("PNG");
  });

  it("rejects a request with no file", async () => {
    const res = await request(app).post("/api/uploads");
    expect(res.status).toBe(400);
  });
});
