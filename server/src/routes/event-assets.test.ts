import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const P = "[test:event-assets] ";

// Only keys with our prefix are ever deleted — the real registry is never touched.
afterAll(async () => {
  await prisma.eventAsset.deleteMany({ where: { key: { startsWith: P } } });
  await prisma.$disconnect();
});

describe("/api/event-assets", () => {
  it("401s without an admin token", async () => {
    expect((await request(app).get("/api/event-assets")).status).toBe(401);
    expect((await request(app).post("/api/event-assets/bulk").send({ assets: [] })).status).toBe(401);
  });

  it("saves in bulk; a repeated key updates its url instead of adding a row", async () => {
    const key = `${P}item-9-diamond`;
    const first = await request(app).post("/api/event-assets/bulk").set(ADMIN)
      .send({ assets: [{ key, url: "/uploads/a.webp" }] });
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ saved: 1 });
    await request(app).post("/api/event-assets/bulk").set(ADMIN).send({ assets: [{ key, url: "/uploads/b.webp" }] });

    const list = await request(app).get("/api/event-assets").set(ADMIN);
    const mine = list.body.filter((a: { key: string }) => a.key === key);
    expect(mine).toEqual([{ key, url: "/uploads/b.webp" }]);
  });

  it("400s a url outside /uploads/", async () => {
    const r = await request(app).post("/api/event-assets/bulk").set(ADMIN)
      .send({ assets: [{ key: `${P}x`, url: "https://evil.example/x.png" }] });
    expect(r.status).toBe(400);
  });
});
