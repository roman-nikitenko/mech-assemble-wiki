import { afterEach, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { strToU8, zipSync } from "fflate";
import { createViewerUploadRouter } from "./viewer-uploads";
import { VIEWER_URL_RE } from "../lib/viewerPack";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const GOOD = Buffer.from(zipSync({ "mech-viewer/index.html": strToU8("<html></html>") }));

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "viewer-route-"));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const makeApp = () => {
  const app = express();
  app.use("/api/uploads/viewer", createViewerUploadRouter({ dir }));
  return app;
};

describe("POST /api/uploads/viewer", () => {
  it("401s without an admin token", async () => {
    // No file attached: auth must reject before any upload is read.
    expect((await request(makeApp()).post("/api/uploads/viewer")).status).toBe(401);
  });

  it("unpacks a zip and returns the viewer url", async () => {
    const res = await request(makeApp()).post("/api/uploads/viewer").set(ADMIN).attach("viewer", GOOD, "mech-viewer.zip");
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(VIEWER_URL_RE);
    expect(fs.existsSync(path.join(dir, res.body.url.replace("/uploads/", "")))).toBe(true);
  });

  it("400s with the reason for a bad pack", async () => {
    const bad = Buffer.from(zipSync({ "page.html": strToU8("x") }));
    const res = await request(makeApp()).post("/api/uploads/viewer").set(ADMIN).attach("viewer", bad, "x.zip");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/index\.html/);
  });

  it("400s when no file is sent, or it is over 20 MB", async () => {
    const none = await request(makeApp()).post("/api/uploads/viewer").set(ADMIN);
    expect(none.status).toBe(400);
    const big = await request(makeApp())
      .post("/api/uploads/viewer").set(ADMIN)
      .attach("viewer", Buffer.alloc(20 * 1024 * 1024 + 1), "big.zip");
    expect(big.status).toBe(400);
    expect(big.body.error).toMatch(/20 MB/);
  });
});
