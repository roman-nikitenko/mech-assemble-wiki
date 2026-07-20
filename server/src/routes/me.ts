import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authSub, requireUser } from "../lib/auth";

export const meRouter = Router();

// Both endpoints require a valid Auth0 JWT. "Registration" IS the first
// GET: find-or-create keyed by the Auth0 sub.
meRouter.get("/", requireUser, async (req, res) => {
  const sub = authSub(req);
  if (!sub) return res.status(401).json({ error: "Unauthorized" });

  const existing = await prisma.user.findUnique({ where: { auth0Sub: sub } });
  if (existing) {
    return res.json({
      id: existing.id,
      nickname: existing.nickname,
      server: existing.server,
      isNew: false,
    });
  }
  const created = await prisma.user.create({ data: { auth0Sub: sub } });
  res.status(201).json({ id: created.id, nickname: null, server: null, isNew: true });
});

meRouter.put("/", requireUser, async (req, res) => {
  const sub = authSub(req);
  if (!sub) return res.status(401).json({ error: "Unauthorized" });

  const b = (req.body ?? {}) as Record<string, unknown>;
  if (typeof b.nickname !== "string" || b.nickname.trim() === "") {
    return res.status(400).json({ error: "A nickname is required." });
  }
  if (b.server !== undefined && b.server !== null && typeof b.server !== "string") {
    return res.status(400).json({ error: "server must be a string or null." });
  }
  const nickname = b.nickname.trim();
  const server =
    typeof b.server === "string" && b.server.trim() !== "" ? b.server.trim() : null;

  try {
    const user = await prisma.user.upsert({
      where: { auth0Sub: sub },
      create: { auth0Sub: sub, nickname, server },
      update: { nickname, server },
    });
    res.json({ id: user.id, nickname: user.nickname, server: user.server, isNew: false });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "That nickname is taken." });
    }
    throw err;
  }
});
