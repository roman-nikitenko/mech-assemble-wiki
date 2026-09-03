import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { parseAwakeningInput } from "../lib/awakening-input";
import { UUID_RE } from "../lib/uuid";

export const awakeningRouter = Router();

/** The ladder is exactly 6 rows, one per awakening level — a partial ladder
    would silently under-report costs in the UI, so we require all six. */
const LEVELS = [1, 2, 3, 4, 5, 6];

interface TierInput {
  level: number;
  outerPoints: number;
  outerShards: number;
  coreMajor: number;
  coreShards: number;
  acctStats: string[];
}

function parseTiers(body: unknown): { ok: true; value: TierInput[] } | { ok: false; message: string } {
  const tiers = (body as { tiers?: unknown } | null)?.tiers;
  if (!Array.isArray(tiers)) return { ok: false, message: "tiers must be an array." };
  const out: TierInput[] = [];
  for (const raw of tiers) {
    // A null or primitive entry would throw on the first field access, turning
    // a bad request into a 500 — reject it as the 400 it is.
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, message: "Every tier must be an object." };
    }
    const t = raw as Partial<TierInput>;
    const nums = [t.level, t.outerPoints, t.outerShards, t.coreMajor, t.coreShards];
    if (nums.some((n) => typeof n !== "number" || !Number.isInteger(n) || n < 0)) {
      return { ok: false, message: "Every tier needs integer level and cost fields." };
    }
    if (t.acctStats !== undefined && (!Array.isArray(t.acctStats) || t.acctStats.some((s) => typeof s !== "string"))) {
      return { ok: false, message: "acctStats must be an array of strings." };
    }
    out.push({
      level: t.level as number,
      outerPoints: t.outerPoints as number,
      outerShards: t.outerShards as number,
      coreMajor: t.coreMajor as number,
      coreShards: t.coreShards as number,
      acctStats: (t.acctStats ?? []).map((s) => s.trim()).filter((s) => s !== ""),
    });
  }
  const seen = out.map((t) => t.level).sort((a, b) => a - b);
  if (seen.length !== 6 || !LEVELS.every((l, i) => seen[i] === l)) {
    return { ok: false, message: "tiers must contain exactly levels 1 through 6, once each." };
  }
  return { ok: true, value: out };
}

awakeningRouter.get("/cost-tiers", async (_req, res) => {
  const tiers = await prisma.awakeningCostTier.findMany({ orderBy: { level: "asc" } });
  res.json(tiers);
});

awakeningRouter.put("/cost-tiers", requireAdmin, async (req, res) => {
  const parsed = parseTiers(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.message });
  // Replace-the-set inside a transaction: the ladder is meaningless half-written.
  const tiers = await prisma.$transaction(async (tx) => {
    await tx.awakeningCostTier.deleteMany({});
    await tx.awakeningCostTier.createMany({ data: parsed.value });
    return tx.awakeningCostTier.findMany({ orderBy: { level: "asc" } });
  });
  res.json(tiers);
});

const LEVEL_SHAPE = {
  orderBy: { level: "asc" as const },
  include: { nodes: { orderBy: { position: "asc" as const } } },
};

awakeningRouter.get("/mechs/:mechId", async (req, res) => {
  const { mechId } = req.params;
  if (!UUID_RE.test(mechId)) return res.status(404).json({ error: "Mech not found." });
  const mech = await prisma.mech.findUnique({ where: { id: mechId }, select: { id: true } });
  if (!mech) return res.status(404).json({ error: "Mech not found." });
  const levels = await prisma.awakeningLevel.findMany({ where: { mechId }, ...LEVEL_SHAPE });
  res.json(levels);
});

awakeningRouter.put("/mechs/:mechId", requireAdmin, async (req, res) => {
  const { mechId } = req.params;
  if (!UUID_RE.test(mechId)) return res.status(404).json({ error: "Mech not found." });
  const mech = await prisma.mech.findUnique({ where: { id: mechId }, select: { id: true, rank: true } });
  if (!mech) return res.status(404).json({ error: "Mech not found." });
  // Awakening is an S-tier system; letting it onto a Standard mech would put
  // rows behind a tab that never renders.
  if (mech.rank !== "S") {
    return res.status(400).json({ error: "Only S-tier mechs have an awakening tree." });
  }

  const parsed = parseAwakeningInput(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.message });

  // Replace-the-set, same contract as mech skins: the editor always submits the
  // whole tree, so a delete-then-recreate keeps write logic trivial. Nodes
  // cascade from their level, so deleting levels is enough.
  const levels = await prisma.$transaction(async (tx) => {
    await tx.awakeningLevel.deleteMany({ where: { mechId } });
    for (const l of parsed.value) {
      await tx.awakeningLevel.create({
        data: {
          mechId,
          level: l.level,
          isLive: l.isLive,
          coreAttr: l.coreAttr,
          coreSkill: l.coreSkill,
          coreInfo: l.coreInfo,
          coreCd: l.coreCd,
          corePower: l.corePower,
          coreLuckyId: l.coreLuckyId,
          coreReward: l.coreReward,
          coreSkin: l.coreSkin,
          nodes: { create: l.nodes },
        },
      });
    }
    return tx.awakeningLevel.findMany({ where: { mechId }, ...LEVEL_SHAPE });
  });

  res.json(levels);
});
