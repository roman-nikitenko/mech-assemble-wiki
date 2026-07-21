import { Router } from "express";
import type { Request } from "express";
import type { BuildStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authSub, requireUser } from "../lib/auth";

export const buildsRouter = Router();

function formatBuild(b: {
  id: string;
  name: string;
  description: string;
  mechId: string | null;
  weaponId: string | null;
  skillIds: string[];
  weaponIds: string[];
  weaponSkillIds: unknown;
  status: BuildStatus;
  hearts: number;
  createdAt: Date;
  updatedAt: Date;
  user: { nickname: string | null; server: string | null };
}) {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    mechId: b.mechId,
    weaponId: b.weaponId,
    skillIds: b.skillIds,
    weaponIds: b.weaponIds,
    weaponSkillIds: b.weaponSkillIds as Record<string, string[]>,
    status: b.status,
    hearts: b.hearts,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    author: { nickname: b.user.nickname, server: b.user.server },
  };
}

const withAuthor = { user: { select: { nickname: true, server: true } } } as const;

/** Find-or-create the User row for the request's Auth0 subject. Every
    authenticated write goes through here, so a first-time poster gets a row. */
function currentUser(req: Request) {
  const sub = authSub(req);
  return prisma.user.upsert({ where: { auth0Sub: sub }, create: { auth0Sub: sub }, update: {} });
}

/** Validate + normalize the editable build fields shared by create and edit.
    Returns null when the name is missing (the one hard requirement). */
function parseBuildInput(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim() === "") return null;
  return {
    name: b.name.trim(),
    description: typeof b.description === "string" ? b.description.trim() : "",
    mechId: typeof b.mechId === "string" ? b.mechId : null,
    weaponId: typeof b.weaponId === "string" ? b.weaponId : null,
    skillIds: Array.isArray(b.skillIds) ? (b.skillIds as string[]) : [],
    weaponIds: Array.isArray(b.weaponIds) ? (b.weaponIds as string[]) : [],
    weaponSkillIds:
      b.weaponSkillIds !== null && typeof b.weaponSkillIds === "object"
        ? (b.weaponSkillIds as Record<string, string[]>)
        : {},
  };
}

// ---------- Reads ----------

// My builds — every status (Draft/Published/Unposted). Powers the Profile
// list and the build editor. MUST be declared before "/:id" so the literal
// path wins over the param route.
buildsRouter.get("/mine", requireUser, async (req, res) => {
  const user = await currentUser(req);
  const builds = await prisma.build.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: withAuthor,
  });
  res.json(builds.map(formatBuild));
});

// Public feed — only Published builds, newest first.
buildsRouter.get("/", async (_req, res) => {
  const builds = await prisma.build.findMany({
    where: { status: "Published" },
    orderBy: { createdAt: "desc" },
    include: withAuthor,
  });
  res.json(builds.map(formatBuild));
});

// Single build for the public detail / share page — Published only. Drafts
// and unposted builds are private (their owner views them via /mine), so a
// stale share link to an unposted build 404s, WordPress-style.
buildsRouter.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const build = await prisma.build.findFirst({
    where: { id, status: "Published" },
    include: withAuthor,
  });
  if (!build) return res.status(404).json({ error: "Build not found" });
  res.json(formatBuild(build));
});

// ---------- Writes ----------

// Create a build. Always starts as a Draft — publishing is a separate step.
buildsRouter.post("/", requireUser, async (req, res) => {
  const user = await currentUser(req);
  const input = parseBuildInput(req.body);
  if (!input) return res.status(400).json({ error: "name is required." });

  const build = await prisma.build.create({
    data: { userId: user.id, ...input },
    include: withAuthor,
  });
  res.status(201).json(formatBuild(build));
});

// Edit an existing build's fields (name, notes, picks). Owner only; the
// status is untouched here — editing a Published build keeps it Published.
buildsRouter.put("/:id", requireUser, async (req, res) => {
  const id = req.params.id as string;
  const user = await currentUser(req);
  const input = parseBuildInput(req.body);
  if (!input) return res.status(400).json({ error: "name is required." });

  const existing = await prisma.build.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Build not found" });
  if (existing.userId !== user.id) return res.status(403).json({ error: "Not your build" });

  const build = await prisma.build.update({
    where: { id },
    data: input,
    include: withAuthor,
  });
  res.json(formatBuild(build));
});

/** Shared owner-guarded status change for publish/unpost. */
async function setStatus(req: Request, res: import("express").Response, status: BuildStatus) {
  const id = req.params.id as string;
  const user = await currentUser(req);
  const existing = await prisma.build.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Build not found" });
  if (existing.userId !== user.id) return res.status(403).json({ error: "Not your build" });

  const build = await prisma.build.update({
    where: { id },
    data: { status },
    include: withAuthor,
  });
  res.json(formatBuild(build));
}

// Publish: Draft/Unposted → Published (visible in the feed).
buildsRouter.post("/:id/publish", requireUser, (req, res) => setStatus(req, res, "Published"));

// Unpost: Published → Unposted (pulled from the feed, row + hearts kept).
buildsRouter.post("/:id/unpost", requireUser, (req, res) => setStatus(req, res, "Unposted"));

// Toggle heart on a build. Creates or removes the join row and keeps the
// denormalized counter in sync — both ops run in one transaction.
buildsRouter.post("/:id/heart", requireUser, async (req, res) => {
  const buildId = req.params.id as string;
  const user = await currentUser(req);

  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) return res.status(404).json({ error: "Build not found" });

  const existing = await prisma.buildHeart.findUnique({
    where: { buildId_userId: { buildId, userId: user.id } },
  });

  let hearts: number;
  let userHearted: boolean;

  if (existing) {
    // Already liked — remove the heart.
    await prisma.$transaction([
      prisma.buildHeart.delete({ where: { buildId_userId: { buildId, userId: user.id } } }),
      prisma.build.update({ where: { id: buildId }, data: { hearts: { decrement: 1 } } }),
    ]);
    hearts = Math.max(0, build.hearts - 1);
    userHearted = false;
  } else {
    // Not yet liked — add the heart.
    await prisma.$transaction([
      prisma.buildHeart.create({ data: { buildId, userId: user.id } }),
      prisma.build.update({ where: { id: buildId }, data: { hearts: { increment: 1 } } }),
    ]);
    hearts = build.hearts + 1;
    userHearted = true;
  }

  res.json({ hearts, userHearted });
});

// Delete own build. Returns 403 if the requesting user doesn't own it.
buildsRouter.delete("/:id", requireUser, async (req, res) => {
  const id = req.params.id as string;
  const user = await currentUser(req);

  const build = await prisma.build.findUnique({ where: { id } });
  if (!build) return res.status(404).json({ error: "Build not found" });
  if (build.userId !== user.id) return res.status(403).json({ error: "Not your build" });

  await prisma.build.delete({ where: { id } });
  res.status(204).end();
});
