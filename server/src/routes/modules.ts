import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";
import { parseModuleInput, type ModuleInput } from "../lib/module-input";

export const modulesRouter = Router();

const DETAIL_INCLUDE = {
  effects: {
    orderBy: { quality: { sortOrder: "asc" } },
    include: {
      bonuses: {
        orderBy: { sortOrder: "asc" },
        include: {
          mech: { select: { id: true, slug: true, name: true, iconUrl: true } },
          weapon: { select: { id: true, slug: true, name: true, iconUrl: true } },
        },
      },
    },
  },
} satisfies Prisma.ModuleInclude;

// Validate DB existence + effect_count gating. Returns an error string or null.
async function validateModule(input: ModuleInput): Promise<string | null> {
  const qualityIds = input.qualityEffects.map((e) => e.qualityId);
  if (new Set(qualityIds).size !== qualityIds.length) return "Duplicate quality in qualityEffects";

  const qualities = await prisma.moduleQuality.findMany({ where: { id: { in: qualityIds } } });
  const byId = new Map(qualities.map((q) => [q.id, q]));

  for (const e of input.qualityEffects) {
    const quality = byId.get(e.qualityId);
    if (!quality) return "Unknown quality id";
    if (quality.effectCount < 1 && (e.effect1Value !== null || e.bonuses.length > 0)) {
      return `Quality '${quality.name}' grants no effects.`;
    }
    for (const bonus of e.bonuses) {
      if (bonus.slot > quality.effectCount) {
        return `Quality '${quality.name}' does not unlock Effect ${bonus.slot}.`;
      }
    }
  }

  // All bonus targets must exist (and be the right entity).
  const mechIds = input.qualityEffects.flatMap((e) => e.bonuses.map((b) => b.mechId).filter((x): x is string => x !== null));
  const weaponIds = input.qualityEffects.flatMap((e) => e.bonuses.map((b) => b.weaponId).filter((x): x is string => x !== null));
  if (mechIds.length) {
    const found = await prisma.mech.count({ where: { id: { in: mechIds } } });
    if (found !== new Set(mechIds).size) return "Unknown mech id in a bonus";
  }
  if (weaponIds.length) {
    const found = await prisma.weapon.count({ where: { id: { in: weaponIds } } });
    if (found !== new Set(weaponIds).size) return "Unknown weapon id in a bonus";
  }
  return null;
}

// Build the nested Prisma create for a module's effects + bonuses.
function effectsCreate(input: ModuleInput): Prisma.ModuleQualityEffectCreateWithoutModuleInput[] {
  return input.qualityEffects.map((e) => ({
    quality: { connect: { id: e.qualityId } },
    effect1Value: e.effect1Value,
    bonuses: {
      create: e.bonuses.map((b) => ({
        slot: b.slot,
        effectText: b.effectText,
        sortOrder: b.sortOrder,
        ...(b.mechId ? { mech: { connect: { id: b.mechId } } } : {}),
        ...(b.weaponId ? { weapon: { connect: { id: b.weaponId } } } : {}),
      })),
    },
  }));
}

modulesRouter.get("/", async (_req, res) => {
  const modules = await prisma.module.findMany({
    orderBy: { name: "asc" },
    include: DETAIL_INCLUDE,
  });
  res.json(modules);
});

modulesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Module not found" });
  const module = await prisma.module.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!module) return res.status(404).json({ error: "Module not found" });
  res.json(module);
});

modulesRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseModuleInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  const invalid = await validateModule(input.value);
  if (invalid) return res.status(400).json({ error: invalid });
  const { qualityEffects, ...fields } = input.value;
  try {
    const module = await prisma.module.create({
      data: { ...fields, effects: { create: effectsCreate(input.value) } },
      include: DETAIL_INCLUDE,
    });
    res.status(201).json(module);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Module '${fields.name}' already exists.` });
    }
    throw err;
  }
});

// PUT — update fields and REPLACE the entire effect set (same semantics as
// weapon skins). Bonuses cascade-delete with their parent effect rows.
modulesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Module not found" });
  const input = parseModuleInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  const invalid = await validateModule(input.value);
  if (invalid) return res.status(400).json({ error: invalid });
  const { qualityEffects, ...fields } = input.value;
  try {
    const module = await prisma.$transaction(async (tx) => {
      await tx.moduleQualityEffect.deleteMany({ where: { moduleId: id } });
      return tx.module.update({
        where: { id },
        data: { ...fields, effects: { create: effectsCreate(input.value) } },
        include: DETAIL_INCLUDE,
      });
    });
    res.json(module);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Module not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Module '${fields.name}' already exists.` });
    }
    throw err;
  }
});

modulesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Module not found" });
  try {
    await prisma.module.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Module not found" });
    }
    throw err;
  }
});
