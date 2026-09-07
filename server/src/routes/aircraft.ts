import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

export const aircraftRouter = Router();

// "aircraft" is both singular and plural, so it's used as-is everywhere here
// (model, table, route, hooks) — there is no "aircrafts".
interface AircraftData {
  name: string;
  description: string | null;
  imageUrl: string | null;
  tier: "Standard" | "S";
  hp: string | null;
  atk: string | null;
  def: string | null;
  specialBonus: string | null;
  rankUpPreview: string[];
}

// Trim a value to a non-empty string, or null. Blank strings become null so the
// stat/description fields stay clean.
function optStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function parseAircraftInput(
  body: unknown
): { ok: true; value: AircraftData } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Aircraft name is required." };
  }
  for (const field of ["description", "imageUrl"] as const) {
    if (b[field] !== undefined && b[field] !== null && typeof b[field] !== "string") {
      return { ok: false, message: `${field} must be a string.` };
    }
  }
  const tier = b.tier ?? "Standard";
  if (tier !== "Standard" && tier !== "S") {
    return { ok: false, message: "tier must be 'Standard' or 'S'." };
  }

  if (
    b.rankUpPreview !== undefined &&
    (!Array.isArray(b.rankUpPreview) || b.rankUpPreview.some((s) => typeof s !== "string"))
  ) {
    return { ok: false, message: "rankUpPreview must be an array of up to 5 strings." };
  }
  // Positional, like the mech field and unlike the weapon/drone ones: the index
  // IS the colour rank (0 = Orange … 4 = Mythic), so an interior blank means
  // "that rank grants nothing" and must keep its slot. Only trailing blanks go.
  const rankUpPreview = ((b.rankUpPreview as string[] | undefined) ?? []).map((s) => s.trim());
  while (rankUpPreview.length > 0 && rankUpPreview[rankUpPreview.length - 1] === "") {
    rankUpPreview.pop();
  }
  if (rankUpPreview.length > 5) {
    return { ok: false, message: "rankUpPreview must be an array of up to 5 strings." };
  }

  return {
    ok: true,
    value: {
      name: b.name.trim(),
      description: optStr(b.description),
      imageUrl: optStr(b.imageUrl),
      tier,
      hp: optStr(b.hp),
      atk: optStr(b.atk),
      def: optStr(b.def),
      specialBonus: optStr(b.specialBonus),
      rankUpPreview,
    },
  };
}

// GET /api/aircraft — the aircraft catalog, for the public page and admin CRUD.
aircraftRouter.get("/", async (_req, res) => {
  const aircraft = await prisma.aircraft.findMany({ orderBy: { name: "asc" } });
  res.json(aircraft);
});

// POST /api/aircraft
aircraftRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseAircraftInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const aircraft = await prisma.aircraft.create({ data: input.value });
    res.status(201).json(aircraft);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Aircraft '${input.value.name}' already exists.` });
    }
    throw err;
  }
});

// PUT /api/aircraft/:id
aircraftRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Aircraft not found" });
  const input = parseAircraftInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const aircraft = await prisma.aircraft.update({ where: { id }, data: input.value });
    res.json(aircraft);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Aircraft not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Aircraft '${input.value.name}' already exists.` });
    }
    throw err;
  }
});

// DELETE /api/aircraft/:id — nothing references aircraft, so a plain delete.
aircraftRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Aircraft not found" });
  try {
    await prisma.aircraft.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Aircraft not found" });
    }
    throw err;
  }
});
