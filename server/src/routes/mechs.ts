import { Router } from "express";
import { MechRank, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { buildTree } from "../lib/build-tree";
import { parseMechInput } from "../lib/mech-input";
import { createSkillNodes } from "../lib/skill-nodes";
import { UUID_RE } from "../lib/uuid";

export const mechsRouter = Router();

// The browse-page shape. imageUrl rides along so cards can show art.
const SUMMARY_SELECT = {
  id: true,
  name: true,
  epithet: true,
  type: { select: { id: true, name: true, iconUrl: true } },
  rank: true,
  quality: true,
  imageUrl: true,
} as const;

// A mech may only carry a pilot when it's S-tier, and the pilot must exist.
// Returns an error message or null. (Assignment itself happens inside the
// create/update transactions below.)
async function validateMechPilotLink(
  pilotId: string | null | undefined,
  rank: string
): Promise<string | null> {
  if (pilotId === undefined || pilotId === null) return null;
  if (!UUID_RE.test(pilotId)) return "Unknown pilot id";
  const pilot = await prisma.pilot.findUnique({ where: { id: pilotId } });
  if (!pilot) return "Unknown pilot id";
  if (rank !== "S") return "Only S-tier mechs can have a pilot";
  return null;
}

// A mech's type must reference an existing catalog row (or be null).
async function validateMechTypeLink(typeId: string | null): Promise<string | null> {
  if (typeId === null) return null;
  if (!UUID_RE.test(typeId)) return "Unknown type id";
  const type = await prisma.type.findUnique({ where: { id: typeId } });
  if (!type) return "Unknown type id";
  return null;
}

// Validates an optional ?rank= query param against a Prisma enum.
// Valid values come from the GENERATED enum objects, so adding an enum value
// to schema.prisma automatically updates validation — no hand-kept list.
function parseEnumParam<T extends Record<string, string>>(
  value: unknown,
  enumObj: T,
  name: string
): { ok: true; value: T[keyof T] | undefined } | { ok: false; message: string } {
  if (value === undefined) return { ok: true, value: undefined };
  const valid = Object.values(enumObj);
  if (typeof value === "string" && (valid as string[]).includes(value)) {
    return { ok: true, value: value as T[keyof T] };
  }
  return {
    ok: false,
    message: `Invalid ${name} '${String(value)}'. Valid values: ${valid.join(", ")}`,
  };
}

// GET /api/mechs?typeId=<uuid>&rank=S — summaries for the browse page.
mechsRouter.get("/", async (req, res) => {
  // typeId filters by catalog row. Anything that isn't a uuid can't match —
  // reject it loudly instead of silently returning everything.
  const { typeId } = req.query;
  if (typeId !== undefined && (typeof typeId !== "string" || !UUID_RE.test(typeId))) {
    return res.status(400).json({ error: "Invalid typeId" });
  }
  const rank = parseEnumParam(req.query.rank, MechRank, "rank");
  if (!rank.ok) return res.status(400).json({ error: rank.message });

  const mechs = await prisma.mech.findMany({
    // `undefined` in a where clause means "no filter" to Prisma.
    where: { typeId: typeId as string | undefined, rank: rank.value },
    select: SUMMARY_SELECT,
    orderBy: { name: "asc" },
  });
  res.json(mechs);
});

// Everything the detail page needs, in one query. Upgrades are fetched FLAT
// (plain include, no nesting) and assembled into trees with buildTree below —
// unlike a nested include, this has no depth limit. Ordering makes sibling
// order deterministic.
const detailInclude = {
  skills: {
    orderBy: { name: "asc" },
    include: { upgrades: { orderBy: { name: "asc" } } },
  },
  traits: { include: { trait: true } },
  awakeningLevels: {
    orderBy: { level: "asc" },
    include: { nodes: { orderBy: { position: "asc" } }, unlocks: true },
  },
  weapon: {
    include: {
      upgrades: { orderBy: { name: "asc" } },
      weaponSkins: true,
      skillNodes: { orderBy: { sortOrder: "asc" as const } },
      helpers: { include: { ranks: { orderBy: { rank: "asc" } } } },
      type: { select: { id: true, name: true, iconUrl: true } },
      pilot: { select: { id: true, name: true } },
    },
  },
  accessory: true,
  type: { select: { id: true, name: true, iconUrl: true } },
  pilot: { select: { id: true, name: true } },
  skillNodes: { orderBy: { sortOrder: "asc" as const } },
  skins: { include: { stars: { orderBy: { star: "asc" } } } },
  helpers: { include: { ranks: { orderBy: { rank: "asc" } } } },
} satisfies Prisma.MechInclude;

// GET /api/mechs/:id — one mech with everything nested.
mechsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  // A malformed UUID would make Postgres/Prisma throw before the lookup even
  // runs. Catching it here means every kind of "no such mech" gets the same
  // clean 404 instead of a confusing 500.
  if (!UUID_RE.test(id)) {
    return res.status(404).json({ error: "Mech not found" });
  }

  const mech = await prisma.mech.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!mech) {
    return res.status(404).json({ error: "Mech not found" });
  }

  // Swap the flat upgrade lists for assembled trees before responding.
  res.json({
    ...mech,
    skills: mech.skills.map((skill) => ({
      ...skill,
      upgrades: buildTree(skill.upgrades),
    })),
    weapon: mech.weapon
      ? { ...mech.weapon, upgrades: buildTree(mech.weapon.upgrades) }
      : null,
  });
});

// POST /api/mechs — create a mech (admin). Core identity + traits only;
// nested systems (skills, weapon, ...) are managed elsewhere for now.
// ⚠️ No auth yet (deliberate, local-only) — must be protected before deploy.
mechsRouter.post("/", async (req, res) => {
  const input = parseMechInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  const { traitIds, pilotId, skills, ...fields } = input.value;

  // Check trait ids up front so the client gets a helpful 400 instead of a
  // cryptic foreign-key error from the database.
  const found = await prisma.trait.findMany({ where: { id: { in: traitIds } } });
  if (found.length !== traitIds.length) {
    const known = new Set(found.map((t) => t.id));
    const unknown = traitIds.filter((id) => !known.has(id));
    return res.status(400).json({ error: `Unknown trait ids: ${unknown.join(", ")}` });
  }

  const pilotError = await validateMechPilotLink(pilotId, fields.rank);
  if (pilotError) return res.status(400).json({ error: pilotError });

  const typeError = await validateMechTypeLink(input.value.typeId);
  if (typeError) return res.status(400).json({ error: typeError });

  try {
    const mech = await prisma.$transaction(async (tx) => {
      const created = await tx.mech.create({
        data: {
          ...fields,
          traits: { create: traitIds.map((traitId) => ({ traitId })) },
        },
        select: SUMMARY_SELECT,
      });
      if (pilotId !== undefined && pilotId !== null) {
        // Seat the pilot — if they're in another mech, this MOVES them
        // (mech_id is unique, and we just vacated nothing: the new mech
        // can't have a pilot yet).
        // either/or: seating into a mech un-seats from any weapon
        await tx.pilot.update({ where: { id: pilotId }, data: { mechId: created.id, weaponId: null } });
      }
      await createSkillNodes(tx, { mechId: created.id }, skills);
      return created;
    });
    res.status(201).json(mech);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `A mech named '${fields.name}' already exists.` });
    }
    throw err;
  }
});

// PUT /api/mechs/:id — update core fields and REPLACE the trait set.
mechsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Mech not found" });

  const input = parseMechInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  const { traitIds, pilotId, skills, ...fields } = input.value;

  const found = await prisma.trait.findMany({ where: { id: { in: traitIds } } });
  if (found.length !== traitIds.length) {
    const known = new Set(found.map((t) => t.id));
    const unknown = traitIds.filter((tid) => !known.has(tid));
    return res.status(400).json({ error: `Unknown trait ids: ${unknown.join(", ")}` });
  }

  const pilotError = await validateMechPilotLink(pilotId, fields.rank);
  if (pilotError) return res.status(400).json({ error: pilotError });

  const typeError = await validateMechTypeLink(input.value.typeId);
  if (typeError) return res.status(400).json({ error: typeError });

  try {
    const mech = await prisma.$transaction(async (tx) => {
      await tx.mechTrait.deleteMany({ where: { mechId: id } });
      const updated = await tx.mech.update({
        where: { id },
        data: {
          ...fields,
          traits: { create: traitIds.map((traitId) => ({ traitId })) },
        },
        select: SUMMARY_SELECT,
      });
      // Tri-state: undefined = leave the cockpit as-is; null = vacate;
      // string = vacate then seat the chosen pilot (moving them if needed).
      if (pilotId !== undefined) {
        await tx.pilot.updateMany({ where: { mechId: id }, data: { mechId: null } });
        if (pilotId !== null) {
          // either/or: seating into a mech un-seats from any weapon
          await tx.pilot.update({ where: { id: pilotId }, data: { mechId: id, weaponId: null } });
        }
      }
      // Replace the mech's whole skill tree — same set semantics as weapons.
      await tx.skillNode.deleteMany({ where: { mechId: id } });
      await createSkillNodes(tx, { mechId: id }, skills);
      return updated;
    });
    res.json(mech);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      // P2025 = "record to update not found"
      return res.status(404).json({ error: "Mech not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Two unique constraints can fire inside this transaction: the mech
      // NAME, or pilots.mech_id from the seat step. err.meta.target says
      // which — same disambiguation pattern as pilots.ts.
      const target = (err.meta?.target as string[] | undefined) ?? [];
      if (target.includes("mech_id")) {
        return res.status(409).json({ error: "That mech already has a pilot." });
      }
      return res.status(409).json({ error: `A mech named '${fields.name}' already exists.` });
    }
    throw err;
  }
});

// DELETE /api/mechs/:id — removes the mech AND (via onDelete: Cascade) its
// entire kit: skills, upgrades, weapon, accessory, skins, helpers, awakening.
// The admin UI warns before calling this. The image FILE is not deleted
// (acceptable orphan for now — future cleanup job).
mechsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Mech not found" });
  try {
    await prisma.mech.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Mech not found" });
    }
    throw err;
  }
});
