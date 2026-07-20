import { Router } from "express";
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
    hearts: b.hearts,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    author: { nickname: b.user.nickname, server: b.user.server },
  };
}

// Single posted build — used by the detail page.
buildsRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  const build = await prisma.build.findUnique({
    where: { id },
    include: { user: { select: { nickname: true, server: true } } },
  });
  if (!build) return res.status(404).json({ error: "Build not found" });
  res.json(formatBuild(build));
});

// Public feed — all posted builds, newest first.
buildsRouter.get("/", async (_req, res) => {
  const builds = await prisma.build.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { nickname: true, server: true } } },
  });
  res.json(builds.map(formatBuild));
});

// Post a build to the community feed. Requires a logged-in user.
buildsRouter.post("/", requireUser, async (req, res) => {
  const sub = authSub(req);
  const user = await prisma.user.upsert({
    where: { auth0Sub: sub },
    create: { auth0Sub: sub },
    update: {},
  });

  const b = (req.body ?? {}) as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim() === "") {
    return res.status(400).json({ error: "name is required." });
  }

  const build = await prisma.build.create({
    data: {
      userId: user.id,
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
    },
    include: { user: { select: { nickname: true, server: true } } },
  });

  res.status(201).json(formatBuild(build));
});

// Toggle heart on a build. Creates or removes the join row and keeps the
// denormalized counter in sync — both ops run in one transaction.
buildsRouter.post("/:id/heart", requireUser, async (req, res) => {
  const sub = authSub(req);
  const buildId = req.params.id as string;
  const user = await prisma.user.upsert({
    where: { auth0Sub: sub },
    create: { auth0Sub: sub },
    update: {},
  });

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
  const sub = authSub(req);
  const id = req.params.id as string;
  const user = await prisma.user.upsert({
    where: { auth0Sub: sub },
    create: { auth0Sub: sub },
    update: {},
  });

  const build = await prisma.build.findUnique({ where: { id } });
  if (!build) return res.status(404).json({ error: "Build not found" });
  if (build.userId !== user.id) return res.status(403).json({ error: "Not your build" });

  await prisma.build.delete({ where: { id } });
  res.status(204).end();
});
