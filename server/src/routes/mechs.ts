import { Router } from "express";
import { MechRank, MechType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { buildTree } from "../lib/build-tree";

export const mechsRouter = Router();

// Validates an optional ?type= / ?rank= query param against a Prisma enum.
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

// GET /api/mechs?type=Thunder&rank=S — summaries for the browse page.
mechsRouter.get("/", async (req, res) => {
  const type = parseEnumParam(req.query.type, MechType, "type");
  if (!type.ok) return res.status(400).json({ error: type.message });
  const rank = parseEnumParam(req.query.rank, MechRank, "rank");
  if (!rank.ok) return res.status(400).json({ error: rank.message });

  const mechs = await prisma.mech.findMany({
    // `undefined` in a where clause means "no filter" to Prisma.
    where: { type: type.value, rank: rank.value },
    select: { id: true, name: true, epithet: true, type: true, rank: true, quality: true },
    orderBy: { name: "asc" },
  });
  res.json(mechs);
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      skins: { include: { stars: { orderBy: { star: "asc" } } } },
      helpers: { include: { ranks: { orderBy: { rank: "asc" } } } },
    },
  },
  accessory: true,
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
