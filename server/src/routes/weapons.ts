import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { parseWeaponInput } from "../lib/weapon-input";
import { createSkillNodes } from "../lib/skill-nodes";
import { UUID_RE } from "../lib/uuid";
import { slugify } from "../lib/slug";

export const weaponsRouter = Router();

// Everything the admin list and forms need in one shape. (slug is a scalar
// column, so it comes back automatically — no select entry needed here.)
const WEAPON_INCLUDE = {
  type: { select: { id: true, name: true, iconUrl: true } },
  mech: { select: { id: true, name: true } },
  pilot: { select: { id: true, name: true } },
  weaponSkins: true,
  skillNodes: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.WeaponInclude;

// Picks a slug not already taken by another weapon. `desired` is the admin's
// input (or the weapon name when they left it blank); it's slugified here, so
// callers can pass raw text. On collision it appends -2, -3, ... `excludeId`
// lets a weapon keep its own slug on update. Mirrors uniqueMechSlug — but
// weapon names aren't unique, so the suffix path is hit routinely, not rarely.
async function uniqueWeaponSlug(
  tx: Prisma.TransactionClient,
  desired: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(desired) || "weapon";
  let candidate = base;
  for (let n = 2; ; n++) {
    const clash = await tx.weapon.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
}

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

// The public detail page needs the full kit: everything the list has, plus
// helpers (with their ranks) — mirrors the weapon include nested in the mech
// detail endpoint. The legacy `upgrades` tree is deliberately omitted (dormant).
const WEAPON_DETAIL_INCLUDE = {
  type: { select: { id: true, name: true, iconUrl: true } },
  // iconUrl + a bonus feed the detail page's linked mech/pilot rows.
  // slug lets the "linked mech" row link to the pretty /mechs/<slug> URL.
  mech: { select: { id: true, slug: true, name: true, iconUrl: true, specialBonus: true } },
  pilot: { select: { id: true, name: true, iconUrl: true, unlockBoost: true } },
  weaponSkins: true,
  skillNodes: { orderBy: { sortOrder: "asc" as const } },
  helpers: { include: { ranks: { orderBy: { rank: "asc" as const } } } },
} satisfies Prisma.WeaponInclude;

// GET /api/weapons
weaponsRouter.get("/", async (_req, res) => {
  const weapons = await prisma.weapon.findMany({
    orderBy: { name: "asc" },
    include: WEAPON_INCLUDE,
  });
  res.json(weapons);
});

// GET /api/weapons/:idOrSlug — public single-weapon read for the detail page.
// Accepts EITHER the pretty slug (/weapons/void-reaver, what links use now) OR
// the raw UUID (old links stay valid).
weaponsRouter.get("/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  // Looks-like-a-UUID => look up by id; otherwise treat it as a slug.
  const where = UUID_RE.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
  const weapon = await prisma.weapon.findUnique({
    where,
    include: WEAPON_DETAIL_INCLUDE,
  });
  if (!weapon) return res.status(404).json({ error: "Weapon not found" });
  res.json(weapon);
});

// POST /api/weapons — weapon + inline skins + optional links, atomically.
weaponsRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseWeaponInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  const { pilotId, skins, skills, slug, ...fields } = input.value;

  const linkError = await validateWeaponLinks(input.value);
  if (linkError) return res.status(400).json({ error: linkError });

  try {
    const weapon = await prisma.$transaction(async (tx) => {
      // Slugify the admin's slug (or the name if blank) and make it unique.
      const finalSlug = await uniqueWeaponSlug(tx, slug ?? fields.name);
      const created = await tx.weapon.create({
        data: {
          ...fields,
          slug: finalSlug,
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
      if (target.includes("slug")) {
        return res.status(409).json({ error: "That slug is already in use." });
      }
    }
    throw err;
  }
});

// PUT /api/weapons/:id — update fields, REPLACE the skins set, and apply the
// tri-state pilot link, all atomically.
weaponsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Weapon not found" });

  const input = parseWeaponInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  const { pilotId, skins, skills, slug, ...fields } = input.value;

  const linkError = await validateWeaponLinks(input.value);
  if (linkError) return res.status(400).json({ error: linkError });

  try {
    const weapon = await prisma.$transaction(async (tx) => {
      // Recompute the slug from the admin's field (or the name if blank),
      // excluding THIS weapon — so re-saving without touching the slug keeps it.
      const finalSlug = await uniqueWeaponSlug(tx, slug ?? fields.name, id);
      // Replace-the-set: same pattern as mech traits.
      await tx.weaponSkin.deleteMany({ where: { weaponId: id } });
      await tx.weapon.update({
        where: { id },
        data: {
          ...fields,
          slug: finalSlug,
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
      if (target.includes("slug")) {
        return res.status(409).json({ error: "That slug is already in use." });
      }
    }
    throw err;
  }
});

// DELETE /api/weapons/:id — cascades weapon_upgrades and weapon_skins; the
// pilot is freed (SetNull); the owning mech and the type are untouched.
weaponsRouter.delete("/:id", requireAdmin, async (req, res) => {
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
