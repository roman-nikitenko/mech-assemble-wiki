import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseWeaponInput } from "../lib/weapon-input";
import { createSkillNodes } from "../lib/skill-nodes";
import { UUID_RE } from "../lib/uuid";

export const weaponsRouter = Router();

// Everything the admin list and forms need in one shape.
const WEAPON_INCLUDE = {
  type: { select: { id: true, name: true, iconUrl: true } },
  mech: { select: { id: true, name: true } },
  pilot: { select: { id: true, name: true } },
  weaponSkins: true,
  skillNodes: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.WeaponInclude;

// Shared by POST and PUT: link validations that need the database.
// Returns a user-facing message or null when everything checks out.
async function validateWeaponLinks(input: {
  typeId: string | null;
  mechId: string | null;
  pilotId: string | null | undefined;
}): Promise<string | null> {
  if (input.typeId !== null) {
    if (!UUID_RE.test(input.typeId)) return "Unknown type id";
    const type = await prisma.type.findUnique({ where: { id: input.typeId } });
    if (!type) return "Unknown type id";
  }
  if (input.mechId !== null) {
    if (!UUID_RE.test(input.mechId)) return "Unknown mech id";
    const mech = await prisma.mech.findUnique({ where: { id: input.mechId } });
    if (!mech) return "Unknown mech id";
    if (mech.rank !== "S") return "Only an S-tier mech can own a weapon";
  }
  if (input.pilotId !== undefined && input.pilotId !== null) {
    if (!UUID_RE.test(input.pilotId)) return "Unknown pilot id";
    const pilot = await prisma.pilot.findUnique({ where: { id: input.pilotId } });
    if (!pilot) return "Unknown pilot id";
  }
  return null;
}

// GET /api/weapons
weaponsRouter.get("/", async (_req, res) => {
  const weapons = await prisma.weapon.findMany({
    orderBy: { name: "asc" },
    include: WEAPON_INCLUDE,
  });
  res.json(weapons);
});

// POST /api/weapons — weapon + inline skins + optional links, atomically.
// ⚠️ No auth yet (deliberate, local-only) — must be protected before deploy.
weaponsRouter.post("/", async (req, res) => {
  const input = parseWeaponInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  const { pilotId, skins, skills, ...fields } = input.value;

  const linkError = await validateWeaponLinks(input.value);
  if (linkError) return res.status(400).json({ error: linkError });

  try {
    const weapon = await prisma.$transaction(async (tx) => {
      const created = await tx.weapon.create({
        data: {
          ...fields,
          weaponSkins: { create: skins },
        },
        select: { id: true },
      });
      await createSkillNodes(tx, { weaponId: created.id }, skills);
      if (pilotId !== undefined && pilotId !== null) {
        // One update covers the whole either/or rule: it overwrites any
        // previous weapon link and clears any mech link.
        await tx.pilot.update({
          where: { id: pilotId },
          data: { weaponId: created.id, mechId: null },
        });
      }
      // re-read so the response carries the freshly-seated pilot
      return tx.weapon.findUniqueOrThrow({ where: { id: created.id }, include: WEAPON_INCLUDE });
    });
    res.status(201).json(weapon);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      // The pilot vanished between validation and the transaction — the
      // whole create rolled back, so answer like the validation would have.
      return res.status(400).json({ error: "Unknown pilot id" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      if (target.includes("mech_id")) {
        return res.status(409).json({ error: "That mech already owns a weapon." });
      }
    }
    throw err;
  }
});

// PUT /api/weapons/:id — update fields, REPLACE the skins set, and apply the
// tri-state pilot link, all atomically.
weaponsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Weapon not found" });

  const input = parseWeaponInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  const { pilotId, skins, skills, ...fields } = input.value;

  const linkError = await validateWeaponLinks(input.value);
  if (linkError) return res.status(400).json({ error: linkError });

  try {
    const weapon = await prisma.$transaction(async (tx) => {
      // Replace-the-set: same pattern as mech traits.
      await tx.weaponSkin.deleteMany({ where: { weaponId: id } });
      await tx.weapon.update({
        where: { id },
        data: {
          ...fields,
          weaponSkins: { create: skins },
        },
      });
      // Replace the whole skill tree — same set semantics as the skins.
      await tx.skillNode.deleteMany({ where: { weaponId: id } });
      await createSkillNodes(tx, { weaponId: id }, skills);
      // Tri-state: undefined = leave the pilot link as-is; null = vacate;
      // string = vacate then seat (clearing the pilot's mech — either/or).
      if (pilotId !== undefined) {
        await tx.pilot.updateMany({ where: { weaponId: id }, data: { weaponId: null } });
        if (pilotId !== null) {
          await tx.pilot.update({
            where: { id: pilotId },
            data: { weaponId: id, mechId: null },
          });
        }
      }
      return tx.weapon.findUniqueOrThrow({ where: { id }, include: WEAPON_INCLUDE });
    });
    res.json(weapon);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      // P2025 can come from the weapon update OR the pilot seat —
      // meta.modelName says which record was missing.
      if ((err.meta?.modelName as string | undefined) === "Pilot") {
        return res.status(400).json({ error: "Unknown pilot id" });
      }
      return res.status(404).json({ error: "Weapon not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      if (target.includes("mech_id")) {
        return res.status(409).json({ error: "That mech already owns a weapon." });
      }
    }
    throw err;
  }
});

// DELETE /api/weapons/:id — cascades weapon_upgrades and weapon_skins; the
// pilot is freed (SetNull); the owning mech and the type are untouched.
weaponsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Weapon not found" });
  try {
    await prisma.weapon.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Weapon not found" });
    }
    throw err;
  }
});
