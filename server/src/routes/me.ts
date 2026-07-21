import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authSub, requireUser } from "../lib/auth";

export const meRouter = Router();

/** The Auth0 display name the SPA passes in the x-display-name header
    (URI-encoded so non-ASCII names survive the header). The access token
    itself only carries the sub, so the client is our source for the name. */
function displayName(req: { header(name: string): string | undefined }): string | null {
  const raw = req.header("x-display-name");
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded === "" ? null : decoded;
  } catch {
    return null; // malformed encoding — treat as absent, never crash
  }
}

// Both endpoints require a valid Auth0 JWT. "Registration" IS the first
// GET: find-or-create keyed by the Auth0 sub.
meRouter.get("/", requireUser, async (req, res) => {
  const sub = authSub(req);
  if (!sub) return res.status(401).json({ error: "Unauthorized" });

  const name = displayName(req);
  const existing = await prisma.user.findUnique({ where: { auth0Sub: sub } });
  if (existing) {
    // Keep the stored Auth0 name fresh, but only write when it actually
    // changed so a normal profile load stays a read.
    if (name && name !== existing.name) {
      await prisma.user.update({ where: { auth0Sub: sub }, data: { name } });
    }
    return res.json({
      id: existing.id,
      name: name ?? existing.name,
      nickname: existing.nickname,
      server: existing.server,
      isNew: false,
    });
  }
  const created = await prisma.user.create({ data: { auth0Sub: sub, name } });
  res.status(201).json({ id: created.id, name, nickname: null, server: null, isNew: true });
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
  // Capture the Auth0 name here too so it lands even if the user's first
  // authenticated call is a settings save. Never overwrite a known name
  // with a missing header.
  const name = displayName(req);

  try {
    const user = await prisma.user.upsert({
      where: { auth0Sub: sub },
      create: { auth0Sub: sub, nickname, server, name },
      update: { nickname, server, ...(name ? { name } : {}) },
    });
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
