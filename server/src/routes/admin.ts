import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin, signAdminToken, verifyPassword } from "../lib/auth";
import { getVisitorStats } from "../lib/analytics";

export const adminRouter = Router();

// Deliberately NOT Auth0: one admin credential from .env (user's choice).
adminRouter.post("/login", (req, res) => {
  const b = (req.body ?? {}) as Record<string, unknown>;
  const login = typeof b.login === "string" ? b.login : "";
  const password = typeof b.password === "string" ? b.password : "";
  const okLogin = login === (process.env.ADMIN_LOGIN ?? "");
  const okPassword = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH ?? "");
  // One combined check + one message: never reveal which half failed.
  if (!okLogin || !okPassword) {
    return res.status(401).json({ error: "Wrong login or password" });
  }
  res.json({ token: signAdminToken() });
});

// ---------- Admin-only user management ----------
// These read PII, so unlike the public GET catalogs they are guarded by
// requireAdmin (x-admin-token), same as every write endpoint.

/** List every registered user with a count of the builds they own. */
adminRouter.get("/users", requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { builds: true } } },
  });
  res.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      nickname: u.nickname,
      server: u.server,
      createdAt: u.createdAt,
      buildCount: u._count.builds,
    }))
  );
});

/** Delete a user. Their builds and hearts cascade away with the row. */
adminRouter.delete("/users/:id", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "User not found" });
  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});

// ---------- Dashboard metrics ----------

// 30 days in ms — the window for the "last 30 days" count filters.
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Dashboard numbers: user + published-post counts from our DB, visitor totals
    from GA4 (null when analytics isn't configured, so the UI shows "—"). */
adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const [users, users30, posts, posts30, visitors] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.build.count({ where: { status: "Published" } }),
    prisma.build.count({ where: { status: "Published", createdAt: { gte: since } } }),
    getVisitorStats(),
  ]);

  res.json({
    users: { total: users, last30: users30 },
    posts: { total: posts, last30: posts30 },
    visitors: visitors
      ? { active30min: visitors.active30min, today: visitors.today, total: visitors.total }
      : null,
  });
});
