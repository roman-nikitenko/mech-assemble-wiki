import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { parsePilotInput } from "../lib/pilot-input";
import { UUID_RE } from "../lib/uuid";

export const pilotsRouter = Router();

// Every pilot response carries its linked mech (or null) — the admin table's
// "linked mech" column needs it.
const PILOT_INCLUDE = {
  mech: { select: { id: true, name: true, rank: true } },
  weapon: { select: { id: true, name: true } },
} satisfies Prisma.PilotInclude;

// Shared by POST and PUT: a pilot may only link to an existing S-tier mech.
// Returns an error message or null when the link is valid.
export async function validatePilotMechLink(mechId: string | null): Promise<string | null> {
  if (mechId === null) return null;
  if (!UUID_RE.test(mechId)) return "Unknown mech id";
  const mech = await prisma.mech.findUnique({ where: { id: mechId } });
  if (!mech) return "Unknown mech id";
  if (mech.rank !== "S") return "Pilot can only be linked to an S-tier mech";
  return null;
}

// A pilot may front any existing weapon (no tier rule — weapons have their
// own tier and standard weapons have faces in the game too).
async function validatePilotWeaponLink(weaponId: string | null): Promise<string | null> {
  if (weaponId === null) return null;
  if (!UUID_RE.test(weaponId)) return "Unknown weapon id";
  const weapon = await prisma.weapon.findUnique({ where: { id: weaponId } });
  if (!weapon) return "Unknown weapon id";
  return null;
}

// Both unique constraints (name, mech_id) surface as P2002 — err.meta.target
// says which one fired, so the two get different messages.
function pilotConflictResponse(err: unknown, name: string) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = (err.meta?.target as string[] | undefined) ?? [];
    if (target.includes("weapon_id")) {
      return { status: 409, error: "That weapon already has a pilot." };
    }
    if (target.includes("mech_id")) {
      return { status: 409, error: "That mech already has a pilot." };
    }
    return { status: 409, error: `Pilot '${name}' already exists.` };
  }
  return null;
}

// GET /api/pilots
pilotsRouter.get("/", async (_req, res) => {
  const pilots = await prisma.pilot.findMany({
    orderBy: { name: "asc" },
    include: PILOT_INCLUDE,
  });
  res.json(pilots);
});

// POST /api/pilots
pilotsRouter.post("/", requireAdmin, async (req, res) => {
  const input = parsePilotInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  const linkError = await validatePilotMechLink(input.value.mechId);
  if (linkError) return res.status(400).json({ error: linkError });

  const weaponLinkError = await validatePilotWeaponLink(input.value.weaponId);
  if (weaponLinkError) return res.status(400).json({ error: weaponLinkError });

  try {
    const pilot = await prisma.pilot.create({
      data: input.value,
      include: PILOT_INCLUDE,
    });
    res.status(201).json(pilot);
  } catch (err) {
    const conflict = pilotConflictResponse(err, input.value.name);
    if (conflict) return res.status(conflict.status).json({ error: conflict.error });
    throw err;
  }
});

// PUT /api/pilots/:id
pilotsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Pilot not found" });

  const input = parsePilotInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  const linkError = await validatePilotMechLink(input.value.mechId);
  if (linkError) return res.status(400).json({ error: linkError });

  const weaponLinkError = await validatePilotWeaponLink(input.value.weaponId);
  if (weaponLinkError) return res.status(400).json({ error: weaponLinkError });

  try {
    const pilot = await prisma.pilot.update({
      where: { id },
      data: input.value,
      include: PILOT_INCLUDE,
    });
    res.json(pilot);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Pilot not found" });
    }
    const conflict = pilotConflictResponse(err, input.value.name);
    if (conflict) return res.status(conflict.status).json({ error: conflict.error });
    throw err;
  }
});

// DELETE /api/pilots/:id — removes the PILOT only. The linked mech is not
// affected (the FK lives on pilots, so there is nothing to cascade).
pilotsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Pilot not found" });
  try {
    await prisma.pilot.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Pilot not found" });
    }
    throw err;
  }
});
