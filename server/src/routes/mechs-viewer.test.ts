import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";
import { uploadsDir } from "./uploads";

const ADMIN = { "x-admin-token": testAdminToken() };
const P = "[test:mech-viewer] ";

// The mech routes delete replaced viewer folders from the real uploads folder, so
// every folder here has a fresh random uuid that we create ourselves.
const created: string[] = [];
function makeViewer() {
  const folder = path.join(uploadsDir, "viewers", randomUUID());
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, "index.html"), "x");
  created.push(folder);
  return { folder, url: `/uploads/viewers/${path.basename(folder)}/index.html` };
}

afterAll(async () => {
  await prisma.mech.deleteMany({ where: { name: { startsWith: P } } });
  for (const folder of created) fs.rmSync(folder, { recursive: true, force: true });
  await prisma.$disconnect();
});

const body = (name: string, over: Record<string, unknown> = {}) => ({ name: `${P}${name}`, rank: "S", ...over });
const create = (name: string, over: Record<string, unknown> = {}) =>
  request(app).post("/api/mechs").set(ADMIN).send(body(name, over));
const stored = async (id: string) => (await prisma.mech.findUniqueOrThrow({ where: { id } })).ssViewerUrl;

describe("mech ssViewerUrl", () => {
  it("is saved on an S mech and returned by the detail endpoint", async () => {
    const v = makeViewer();
    const res = await create("Saved", { ssViewerUrl: v.url });
    expect(res.status).toBe(201);
    expect((await request(app).get(`/api/mechs/${res.body.id}`)).body.ssViewerUrl).toBe(v.url);
  });

  it("rejects a url that is not an uploaded viewer, and any viewer on a Standard mech", async () => {
    for (const url of ["https://evil.example/index.html", "/uploads/a.webp", "/uploads/viewers/x/index.html"]) {
      expect((await create("BadUrl", { ssViewerUrl: url })).status).toBe(400);
    }
    expect((await create("Std", { rank: "Standard", ssViewerUrl: makeViewer().url })).status).toBe(400);
  });

  it("PUT without the field keeps the viewer", async () => {
    const v = makeViewer();
    const { body: mech } = await create("Keep", { ssViewerUrl: v.url });
    expect((await request(app).put(`/api/mechs/${mech.id}`).set(ADMIN).send(body("Keep"))).status).toBe(200);
    expect(await stored(mech.id)).toBe(v.url);
    expect(fs.existsSync(v.folder)).toBe(true);
  });

  it("replacing and removing the viewer delete the old folder", async () => {
    const first = makeViewer();
    const second = makeViewer();
    const { body: mech } = await create("Swap", { ssViewerUrl: first.url });
    await request(app).put(`/api/mechs/${mech.id}`).set(ADMIN).send(body("Swap", { ssViewerUrl: second.url }));
    expect(fs.existsSync(first.folder)).toBe(false);
    expect(fs.existsSync(second.folder)).toBe(true);
    await request(app).put(`/api/mechs/${mech.id}`).set(ADMIN).send(body("Swap", { ssViewerUrl: null }));
    expect(await stored(mech.id)).toBeNull();
    expect(fs.existsSync(second.folder)).toBe(false);
  });

  it("changing the mech to Standard clears the viewer", async () => {
    const v = makeViewer();
    const { body: mech } = await create("Demote", { ssViewerUrl: v.url });
    await request(app).put(`/api/mechs/${mech.id}`).set(ADMIN).send(body("Demote", { rank: "Standard" }));
    expect(await stored(mech.id)).toBeNull();
    expect(fs.existsSync(v.folder)).toBe(false);
  });

  it("a folder another mech still uses survives; deleting the last user removes it", async () => {
    const v = makeViewer();
    const { body: a } = await create("Shared A", { ssViewerUrl: v.url });
    const { body: b } = await create("Shared B", { ssViewerUrl: v.url });
    expect((await request(app).delete(`/api/mechs/${a.id}`).set(ADMIN)).status).toBe(204);
    expect(fs.existsSync(v.folder)).toBe(true);
    await request(app).delete(`/api/mechs/${b.id}`).set(ADMIN);
    expect(fs.existsSync(v.folder)).toBe(false);
  });
});
