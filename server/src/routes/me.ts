import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { currentUserId, requireUser } from "../lib/auth";

export const meRouter = Router();

// The user row already exists (created at OAuth callback). GET is a pure
// read; PUT updates the public nickname + game server.
meRouter.get("/", requireUser, async (req, res) => {
  const id = currentUserId(req);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json({
    id: user.id,
    name: user.name,
    nickname: user.nickname,
    server: user.server,
    // Kept for the client's Me type: true until a nickname is chosen.
    isNew: user.nickname === null,
  });
});

meRouter.put("/", requireUser, async (req, res) => {
  const id = currentUserId(req);
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
    const user = await prisma.user.update({ where: { id }, data: { nickname, server } });
    res.json({
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      server: user.server,
      isNew: false,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "That nickname is taken." });
    }
    throw err;
  }
});
