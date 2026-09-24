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
// The admin adds reward rows freely now, so this is a sanity ceiling rather
// than the game's usual two; app-level, like weapon skin bonuses.
const MAX_REWARDS = 6;
// Keeps a stray paste out of the column: amounts read like "3000" or "x1",
// and a type is a short catalog key such as "s-mech-shard".
const MAX_AMOUNT_LEN = 40;
const MAX_TYPE_LEN = 64;

/** One reward: how many, and of what. `type` is a key from the CLIENT's icon
    folder (client/src/lib/rewardIcons.ts) — the server keeps it as free text,
    the same arrangement as the achievement quality art, so adding an icon
    never needs a server change. */
interface Reward {
  type: string | null;
  amount: string;
}

const ORDER = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

interface AchievementInput {
  name: string;
  description: string;
  iconUrl: string | null;
  tier: number;
  rewards: Reward[];
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
  const rewards: Reward[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return { ok: false, message: "Every reward must be an object with an amount." };
    }
    const { type, amount } = entry as Record<string, unknown>;
    if (amount !== undefined && typeof amount !== "string") {
      return { ok: false, message: "A reward amount must be text." };
    }
    if (type !== undefined && type !== null && typeof type !== "string") {
      return { ok: false, message: "A reward type must be text." };
    }
    const trimmedAmount = (amount ?? "").trim();
    // An empty row is dropped rather than rejected: the admin's "+ Add reward"
    // button leaves a blank row behind whenever one is added and not filled in.
    if (trimmedAmount === "") continue;
    if (trimmedAmount.length > MAX_AMOUNT_LEN) {
      return { ok: false, message: `A reward amount is at most ${MAX_AMOUNT_LEN} characters.` };
    }
    const trimmedType = typeof type === "string" ? type.trim() : "";
    if (trimmedType.length > MAX_TYPE_LEN) {
      return { ok: false, message: `A reward type is at most ${MAX_TYPE_LEN} characters.` };
    }
    rewards.push({ type: trimmedType === "" ? null : trimmedType, amount: trimmedAmount });
  }
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
      // rewards is Reward[] — double-cast to satisfy Prisma's Json input type,
      // the same as accessories.attributes in routes/accessories.ts.
      data: { ...fields, rewards: fields.rewards as unknown as Prisma.InputJsonValue, sortOrder: sortOrder ?? 0 },
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
      data: {
        ...fields,
        rewards: fields.rewards as unknown as Prisma.InputJsonValue,
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
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
