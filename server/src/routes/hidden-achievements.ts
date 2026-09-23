import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

// Final Raid hidden achievements.
export const hiddenAchievementsRouter = Router();

// The game's four difficulty tiers; the art for each lives in the client
// (assets/achivments-quality/<tier>.png).
const TIER_MIN = 1;
const TIER_MAX = 4;
// Every achievement in the game grants exactly two rewards, so the form has
// two inputs; the cap is app-level, like weapon skin bonuses.
const MAX_REWARDS = 2;

const ORDER = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

interface AchievementInput {
  name: string;
  description: string;
  iconUrl: string | null;
  tier: number;
  rewards: string[];
  sortOrder: number | undefined; // undefined = leave unchanged on PUT
}

function parseInput(body: unknown): { ok: true; value: AchievementInput } | { ok: false; message: string } {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name === "") return { ok: false, message: "An achievement needs a name." };

  const description = typeof b.description === "string" ? b.description.trim() : "";
  if (description === "") return { ok: false, message: "An achievement needs a description." };

  if (
    typeof b.tier !== "number" ||
    !Number.isInteger(b.tier) ||
    b.tier < TIER_MIN ||
    b.tier > TIER_MAX
  ) {
    return { ok: false, message: `Quality must be a whole number from ${TIER_MIN} to ${TIER_MAX}.` };
  }

  if (b.rewards !== undefined && !Array.isArray(b.rewards)) {
    return { ok: false, message: "rewards must be an array." };
  }
  const raw = (b.rewards as unknown[] | undefined) ?? [];
  // A number or object here is a caller bug, so say so rather than dropping it
  // silently — that would save an achievement with a reward quietly missing.
  if (raw.some((r) => typeof r !== "string")) {
    return { ok: false, message: "Every reward must be text." };
  }
  // Blanks, on the other hand, are dropped rather than rejected: the form
  // always submits both inputs, and leaving the second one empty is normal.
  // Unlike the mech rank-up preview, position carries no meaning here, so a
  // gap can close up.
  const rewards = (raw as string[]).map((r) => r.trim()).filter((r) => r !== "");
  if (rewards.length > MAX_REWARDS) {
    return { ok: false, message: `At most ${MAX_REWARDS} rewards.` };
  }

  const iconUrl = typeof b.iconUrl === "string" && b.iconUrl.trim() !== "" ? b.iconUrl.trim() : null;
  const sortOrder =
    typeof b.sortOrder === "number" && Number.isInteger(b.sortOrder) ? b.sortOrder : undefined;

  return { ok: true, value: { name, description, iconUrl, tier: b.tier, rewards, sortOrder } };
}

hiddenAchievementsRouter.get("/", async (_req, res) => {
  res.json(await prisma.hiddenAchievement.findMany({ orderBy: ORDER }));
});

hiddenAchievementsRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const { sortOrder, ...fields } = input.value;
    const created = await prisma.hiddenAchievement.create({
      data: { ...fields, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "An achievement with that name already exists." });
    }
    throw err;
  }
});

hiddenAchievementsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Achievement not found." });

  const input = parseInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  try {
    const { sortOrder, ...fields } = input.value;
    const updated = await prisma.hiddenAchievement.update({
      where: { id },
      data: { ...fields, ...(sortOrder !== undefined ? { sortOrder } : {}) },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "An achievement with that name already exists." });
      }
      if (err.code === "P2025") return res.status(404).json({ error: "Achievement not found." });
    }
    throw err;
  }
});

hiddenAchievementsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Achievement not found." });
  try {
    await prisma.hiddenAchievement.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Achievement not found." });
    }
    throw err;
  }
});
