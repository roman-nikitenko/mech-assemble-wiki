import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const P = "[test:mod-qual] ";

afterAll(async () => {
  await prisma.moduleQuality.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.$disconnect();
});

describe("module-qualities API", () => {
  it("creates a quality with free-text stats and effect_count", async () => {
    const res = await request(app).post("/api/module-qualities").set(ADMIN).send({
      name: P + "Gold", iconUrl: "/uploads/g.png", hp: "22.00k", atk: "4400", def: "2200",
      effect1Value: "+30%", effectCount: 2, sortOrder: 6,
    });
    expect(res.status).toBe(201);
    expect(res.body.hp).toBe("22.00k");
    expect(res.body.effect1Value).toBe("+30%");
    expect(res.body.effectCount).toBe(2);
  });

  it("400s when effectCount is out of range", async () => {
    const res = await request(app).post("/api/module-qualities").set(ADMIN).send({
      name: P + "Bad", hp: "1", atk: "1", def: "1", effectCount: 4,
    });
    expect(res.status).toBe(400);
  });

  it("lists qualities ordered by sortOrder", async () => {
    await request(app).post("/api/module-qualities").set(ADMIN).send({ name: P + "A", hp: "1", atk: "1", def: "1", effectCount: 0, sortOrder: 1 });
    await request(app).post("/api/module-qualities").set(ADMIN).send({ name: P + "B", hp: "1", atk: "1", def: "1", effectCount: 0, sortOrder: 0 });
    const res = await request(app).get("/api/module-qualities");
    const ours = res.body.filter((q: { name: string }) => q.name.startsWith(P + "A") || q.name.startsWith(P + "B"));
    expect(ours[0].sortOrder).toBeLessThanOrEqual(ours[1].sortOrder);
  });

  it("requires the admin token to write", async () => {
    const res = await request(app).post("/api/module-qualities").send({ name: P + "NoAuth", hp: "1", atk: "1", def: "1", effectCount: 0 });
    expect(res.status).toBe(401);
  });
});
