import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const PREFIX = "[test:feedback]";

beforeAll(() => {
  // Tiny cooldown so the "after the window" case doesn't slow the suite.
  // feedback.ts reads this env var per request (default 45000 in prod).
  process.env.FEEDBACK_COOLDOWN_MS = "100";
});

afterAll(async () => {
  await prisma.feedback.deleteMany({ where: { name: { startsWith: PREFIX } } });
});

// Each test uses a distinct X-Forwarded-For so the per-IP cooldown from one
// test never bleeds into another (trust proxy is on, so req.ip == this value).
function post(body: Record<string, unknown>, ip: string) {
  return request(app).post("/api/feedback").set("X-Forwarded-For", ip).send(body);
}

describe("POST /api/feedback", () => {
  it("stores a valid submission and returns 201", async () => {
    const res = await post({ name: `${PREFIX} Ada`, message: "Great site!" }, "10.0.0.1");
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    const row = await prisma.feedback.findFirst({ where: { name: `${PREFIX} Ada` } });
    expect(row?.message).toBe("Great site!");
    expect(row?.read).toBe(false);
  });

  it("rejects a blank name or message with 400", async () => {
    const a = await post({ name: "   ", message: "hi" }, "10.0.0.2");
    expect(a.status).toBe(400);
    const b = await post({ name: `${PREFIX} X`, message: "  " }, "10.0.0.3");
    expect(b.status).toBe(400);
  });

  it("rejects an over-length name or message with 400", async () => {
    const longName = `${PREFIX} ` + "a".repeat(200);
    const a = await post({ name: longName, message: "hi" }, "10.0.0.4");
    expect(a.status).toBe(400);
    const b = await post({ name: `${PREFIX} Y`, message: "m".repeat(2001) }, "10.0.0.5");
    expect(b.status).toBe(400);
  });

  it("silently drops a submission when the honeypot is filled", async () => {
    const res = await post(
      { name: `${PREFIX} Bot`, message: "spam", website: "http://spam.example" },
      "10.0.0.6",
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    const row = await prisma.feedback.findFirst({ where: { name: `${PREFIX} Bot` } });
    expect(row).toBeNull(); // nothing inserted
  });

  it("rate-limits a second submission from the same IP within the window", async () => {
    const first = await post({ name: `${PREFIX} Fast1`, message: "one" }, "10.0.0.7");
    expect(first.status).toBe(201);
    const second = await post({ name: `${PREFIX} Fast2`, message: "two" }, "10.0.0.7");
    expect(second.status).toBe(429);
    expect(second.body.error).toBe("Too fast, slow down :)");
    // A different IP is unaffected.
    const other = await post({ name: `${PREFIX} Other`, message: "three" }, "10.0.0.8");
    expect(other.status).toBe(201);
    // After the (tiny, test-configured) window, the same IP is accepted again.
    await new Promise((r) => setTimeout(r, 150));
    const third = await post({ name: `${PREFIX} Fast3`, message: "four" }, "10.0.0.7");
    expect(third.status).toBe(201);
  });
});

describe("admin feedback endpoints", () => {
  const ADMIN = { "x-admin-token": testAdminToken() };

  it("requires the admin token for list, unread-count, mark-read and delete", async () => {
    expect((await request(app).get("/api/feedback")).status).toBe(401);
    expect((await request(app).get("/api/feedback/unread-count")).status).toBe(401);
    expect((await request(app).post("/api/feedback/mark-read")).status).toBe(401);
    expect(
      (await request(app).delete("/api/feedback/00000000-0000-4000-8000-000000000000")).status,
    ).toBe(401);
  });

  it("lists newest-first, counts unread, marks read, and deletes", async () => {
    // Two fresh unread rows.
    const older = await prisma.feedback.create({ data: { name: `${PREFIX} Older`, message: "1" } });
    const newer = await prisma.feedback.create({ data: { name: `${PREFIX} Newer`, message: "2" } });

    // List is newest-first: our Newer row appears before our Older row.
    const list = await request(app).get("/api/feedback").set(ADMIN);
    expect(list.status).toBe(200);
    const ours = list.body.filter((f: { name: string }) => f.name.startsWith(PREFIX));
    const idxNewer = ours.findIndex((f: { id: string }) => f.id === newer.id);
    const idxOlder = ours.findIndex((f: { id: string }) => f.id === older.id);
    expect(idxNewer).toBeLessThan(idxOlder);

    // Unread count is at least our two.
    const before = await request(app).get("/api/feedback/unread-count").set(ADMIN);
    expect(before.status).toBe(200);
    expect(before.body.count).toBeGreaterThanOrEqual(2);

    // Mark read zeroes the unread count.
    const marked = await request(app).post("/api/feedback/mark-read").set(ADMIN);
    expect(marked.status).toBe(200);
    const after = await request(app).get("/api/feedback/unread-count").set(ADMIN);
    expect(after.body.count).toBe(0);

    // Delete removes one; deleting a missing id is 404.
    const del = await request(app).delete(`/api/feedback/${newer.id}`).set(ADMIN);
    expect(del.status).toBe(200);
    expect(await prisma.feedback.findUnique({ where: { id: newer.id } })).toBeNull();
    const missing = await request(app)
      .delete("/api/feedback/00000000-0000-4000-8000-000000000000")
      .set(ADMIN);
    expect(missing.status).toBe(404);
  });
});
