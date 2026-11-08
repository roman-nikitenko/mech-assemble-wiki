import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";
import { parseChipImport, parseChipInput, type ChipInput } from "../lib/chip-input";

// Chips (the game's "Gems"): one row per body part, all qualities in a jsonb block.
export const chipsRouter = Router();

// Category is a Prisma enum, so ordering by it follows the enum's declaration
// order (Head, Shoulder, Chest, ...) — the order the public page shows.
const ORDER = [{ category: "asc" as const }, { name: "asc" as const }];

// `qualities` is a typed array in our code but Prisma's Json input type is
// stricter, so we double-cast (same as hidden-achievements rewards).
const toData = (c: ChipInput) => ({
  name: c.name,
  category: c.category,
  qualities: c.qualities as unknown as Prisma.InputJsonValue,
});

chipsRouter.get("/", async (_req, res) => {
  res.json(await prisma.chip.findMany({ orderBy: ORDER }));
});

// POST /api/chips/import — body { chips: [...] }. Upserts BY NAME in a single
// transaction: either every chip is saved or none is. Re-running it after a
// game patch updates the existing rows instead of creating duplicates.
chipsRouter.post("/import", requireAdmin, async (req, res) => {
  const input = parseChipImport(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  const existing = await prisma.chip.findMany({
    where: { name: { in: input.value.map((c) => c.name) } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((c) => c.name));

  await prisma.$transaction(
    input.value.map((c) =>
      prisma.chip.upsert({ where: { name: c.name }, create: toData(c), update: toData(c) }),
    ),
  );

  const updated = input.value.filter((c) => existingNames.has(c.name)).length;
  res.json({ created: input.value.length - updated, updated });
});

chipsRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseChipInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    res.status(201).json(await prisma.chip.create({ data: toData(input.value) }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "A chip with that name already exists." });
    }
    throw err;
  }
});

chipsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Chip not found." });

  const input = parseChipInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  try {
    res.json(await prisma.chip.update({ where: { id }, data: toData(input.value) }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return res.status(409).json({ error: "A chip with that name already exists." });
      if (err.code === "P2025") return res.status(404).json({ error: "Chip not found." });
    }
    throw err;
  }
});

chipsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Chip not found." });
  try {
    await prisma.chip.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Chip not found." });
    }
    throw err;
  }
});
