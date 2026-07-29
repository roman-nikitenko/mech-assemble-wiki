import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// Per-file prefix "[test:sitemap] " for everything this file creates.
afterAll(async () => {
  await prisma.mech.deleteMany({ where: { name: { startsWith: "[test:sitemap] " } } });
  await prisma.weapon.deleteMany({ where: { name: { startsWith: "[test:sitemap] " } } });
  await prisma.$disconnect();
});

describe("GET /api/sitemap.xml", () => {
  it("serves XML that lists static pages plus every mech and weapon URL", async () => {
    const mech = await prisma.mech.create({
      data: { name: "[test:sitemap] Mech", rank: "S" },
    });
    const weapon = await prisma.weapon.create({
      data: { name: "[test:sitemap] Weapon", tier: "S" },
    });

    const res = await request(app).get("/api/sitemap.xml");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/xml");
    // A static landing page and both DB-driven detail URLs are present.
    expect(res.text).toContain("<loc>");
    expect(res.text).toContain("/weapons</loc>");
    expect(res.text).toContain(`/mechs/${mech.id}</loc>`);
    expect(res.text).toContain(`/weapons/${weapon.id}</loc>`);
  });
});
