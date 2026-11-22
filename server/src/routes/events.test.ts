import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const P = "[test:events] ";
// Far above any real game id, so a test import can never collide with real rows.
const GID = 99_000_000;

// Only rows with our prefix are ever deleted — real events are never touched.
afterAll(async () => {
  await prisma.event.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.$disconnect();
});

const ev = (name: string, over: Record<string, unknown> = {}) => ({
  name: `${P}${name}`,
  category: "draw",
  startDate: "2026-11-01",
  endDate: "2026-11-07",
  rewards: [{ section: "Pool", items: [{ name: "Diamond", amount: null, quality: 4 }] }],
  ...over,
});

describe("auth", () => {
  it("401s without an admin token on every write", async () => {
    expect((await request(app).post("/api/events").send(ev("NoAuth"))).status).toBe(401);
    expect((await request(app).post("/api/events/import").send({ events: [] })).status).toBe(401);
    expect((await request(app).put("/api/events/x").send(ev("NoAuth"))).status).toBe(401);
    expect((await request(app).delete("/api/events/x")).status).toBe(401);
  });
});

describe("CRUD", () => {
  it("creates, lists with ISO dates, updates and deletes", async () => {
    const created = await request(app).post("/api/events").set(ADMIN).send(ev("Crud"));
    expect(created.status).toBe(201);
    expect(created.body.startDate).toBe("2026-11-01");
    expect(created.body.rewards[0].items[0].amount).toBe(null);

    const list = await request(app).get("/api/events");
    expect(list.body.some((e: { id: string }) => e.id === created.body.id)).toBe(true);

    const upd = await request(app).put(`/api/events/${created.body.id}`).set(ADMIN).send(ev("Crud", { endDate: "2026-11-09" }));
    expect(upd.status).toBe(200);
    expect(upd.body.endDate).toBe("2026-11-09");

    expect((await request(app).delete(`/api/events/${created.body.id}`).set(ADMIN)).status).toBe(204);
    expect((await request(app).delete(`/api/events/${created.body.id}`).set(ADMIN)).status).toBe(404);
  });

  it("400s when the end is before the start", async () => {
    const r = await request(app).post("/api/events").set(ADMIN).send(ev("Bad", { endDate: "2026-10-01" }));
    expect(r.status).toBe(400);
  });

  it("404s a malformed id", async () => {
    expect((await request(app).put("/api/events/nope").set(ADMIN).send(ev("X"))).status).toBe(404);
  });
});

describe("GET ?from&to", () => {
  it("returns only events overlapping the range", async () => {
    await request(app).post("/api/events").set(ADMIN).send(ev("Early", { startDate: "2031-01-01", endDate: "2031-01-05" }));
    await request(app).post("/api/events").set(ADMIN).send(ev("Late", { startDate: "2031-03-01", endDate: "2031-03-05" }));
    // Spans the boundary: starts before the range, ends inside it.
    await request(app).post("/api/events").set(ADMIN).send(ev("Span", { startDate: "2030-12-30", endDate: "2031-02-02" }));
    const r = await request(app).get("/api/events?from=2031-02-01&to=2031-02-28");
    const names = r.body.map((e: { name: string }) => e.name);
    expect(names).toContain(`${P}Span`);
    expect(names).not.toContain(`${P}Early`);
    expect(names).not.toContain(`${P}Late`);
  });

  it("400s a malformed range", async () => {
    expect((await request(app).get("/api/events?from=yesterday")).status).toBe(400);
  });
});

describe("POST /import", () => {
  it("creates then updates by gameId; re-import creates nothing", async () => {
    const body = { events: [ev("Imp A", { gameId: GID + 1 }), ev("Imp B", { gameId: GID + 2 })] };
    const first = await request(app).post("/api/events/import").set(ADMIN).send(body);
    expect(first.body).toEqual({ created: 2, updated: 0 });
    const second = await request(app).post("/api/events/import").set(ADMIN).send(body);
    expect(second.body).toEqual({ created: 0, updated: 2 });
    expect(await prisma.event.count({ where: { name: { startsWith: `${P}Imp ` } } })).toBe(2);
  });

  it("writes nothing when one event is invalid", async () => {
    const before = await prisma.event.count({ where: { name: { startsWith: P } } });
    const r = await request(app).post("/api/events/import").set(ADMIN)
      .send({ events: [ev("Ok", { gameId: GID + 3 }), ev("Broken", { gameId: GID + 4, category: "nope" })] });
    expect(r.status).toBe(400);
    expect(await prisma.event.count({ where: { name: { startsWith: P } } })).toBe(before);
  });

  it("re-importing hand-made events (no gameId) updates them instead of duplicating", async () => {
    const body = { events: [ev("Manual Backup", { startDate: "2031-06-01", endDate: "2031-06-02" })] };
    expect((await request(app).post("/api/events/import").set(ADMIN).send(body)).body).toEqual({ created: 1, updated: 0 });
    expect((await request(app).post("/api/events/import").set(ADMIN).send(body)).body).toEqual({ created: 0, updated: 1 });
    expect(await prisma.event.count({ where: { name: `${P}Manual Backup` } })).toBe(1);
  });

  it("a re-import with a missing image keeps the picture an admin set by hand", async () => {
    const gameId = GID + 6;
    await request(app).post("/api/events/import").set(ADMIN)
      .send({ events: [ev("Keep Art", { gameId, iconUrl: "/uploads/hand.webp", backgroundUrl: "/uploads/bg.webp", otherBackgrounds: ["/uploads/o.webp"] })] });
    // Same event again, but its images could not be resolved this time (nulls / empty).
    await request(app).post("/api/events/import").set(ADMIN)
      .send({ events: [ev("Keep Art", { gameId, iconUrl: null, backgroundUrl: null, otherBackgrounds: [] })] });
    const row = await prisma.event.findUniqueOrThrow({ where: { gameId } });
    expect(row.iconUrl).toBe("/uploads/hand.webp");
    expect(row.backgroundUrl).toBe("/uploads/bg.webp");
    expect(row.otherBackgrounds).toEqual(["/uploads/o.webp"]);
  });

  it("rejects duplicate gameIds in one file", async () => {
    const r = await request(app).post("/api/events/import").set(ADMIN)
      .send({ events: [ev("D1", { gameId: GID + 5 }), ev("D2", { gameId: GID + 5 })] });
    expect(r.status).toBe(400);
  });
});
