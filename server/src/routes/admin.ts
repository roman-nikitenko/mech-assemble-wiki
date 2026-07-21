import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin, signAdminToken, verifyPassword } from "../lib/auth";

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
