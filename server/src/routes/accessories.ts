import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { parseAccessoryInput } from "../lib/accessory-input";
import { UUID_RE } from "../lib/uuid";

export const accessoriesRouter = Router();

const ACCESSORY_INCLUDE = {
  mech: { select: { id: true, name: true } },
} satisfies Prisma.AccessoryInclude;

// The linked mech must exist and be S rank (the pair accessories are the
// S-mech uniques). Returns a message or null.
async function validateAccessoryMechLink(mechId: string | null): Promise<string | null> {
  if (mechId === null) return null;
  if (!UUID_RE.test(mechId)) return "Unknown mech id";
  const mech = await prisma.mech.findUnique({ where: { id: mechId } });
  if (!mech) return "Unknown mech id";
  if (mech.rank !== "S") return "Accessories can only be linked to an S-tier mech";
  return null;
}

function accessoryConflict(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = (err.meta?.target as string[] | undefined) ?? [];
    if (target.includes("mech_id")) {
      return "That mech already has an accessory.";
    }
  }
  return null;
}

// GET /api/accessories
accessoriesRouter.get("/", async (_req, res) => {
  const accessories = await prisma.accessory.findMany({
    orderBy: { name: "asc" },
    include: ACCESSORY_INCLUDE,
  });
  res.json(accessories);
});

// POST /api/accessories
accessoriesRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseAccessoryInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  const linkError = await validateAccessoryMechLink(input.value.mechId);
  if (linkError) return res.status(400).json({ error: linkError });

  try {
    const accessory = await prisma.accessory.create({
      // attributes is AccessoryAttribute[] — double-cast to satisfy Prisma's Json
      // InputJsonValue: the types don't share an index signature so a direct
      // cast is rejected; routing through unknown is the standard escape hatch.
      data: { ...input.value, attributes: input.value.attributes as unknown as Prisma.InputJsonValue },
      include: ACCESSORY_INCLUDE,
    });
    res.status(201).json(accessory);
  } catch (err) {
    const conflict = accessoryConflict(err);
    if (conflict) return res.status(409).json({ error: conflict });
    throw err;
  }
});

// PUT /api/accessories/:id
accessoriesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Accessory not found" });

  const input = parseAccessoryInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  const linkError = await validateAccessoryMechLink(input.value.mechId);
  if (linkError) return res.status(400).json({ error: linkError });

  try {
    const accessory = await prisma.accessory.update({
      where: { id },
      // attributes is AccessoryAttribute[] — double-cast to satisfy Prisma's Json
      // InputJsonValue: the types don't share an index signature so a direct
      // cast is rejected; routing through unknown is the standard escape hatch.
      data: { ...input.value, attributes: input.value.attributes as unknown as Prisma.InputJsonValue },
      include: ACCESSORY_INCLUDE,
    });
    res.json(accessory);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Accessory not found" });
    }
    const conflict = accessoryConflict(err);
    if (conflict) return res.status(409).json({ error: conflict });
    throw err;
  }
});

// DELETE /api/accessories/:id — the mech is unaffected (FK lives here).
accessoriesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Accessory not found" });
  try {
    await prisma.accessory.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Accessory not found" });
    }
    throw err;
  }
});
