import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

export const dronesRouter = Router();

interface DroneData {
  name: string;
  iconUrl: string | null;
  tier: "Standard" | "S";
  droneTypeId: string | null;
  inheritAttack: string | null;
  atk: string | null;
  hp: string | null;
  def: string | null;
  previewVideoUrl: string | null;
  levelUpBonuses: string[];
}

// Trim a value to a non-empty string, or null. Blank strings become null so the
// stat/video fields stay clean.
function optStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function parseDroneInput(
  body: unknown
): { ok: true; value: DroneData } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Drone name is required." };
  }
  if (b.iconUrl !== undefined && b.iconUrl !== null && typeof b.iconUrl !== "string") {
    return { ok: false, message: "iconUrl must be a string." };
  }
  const tier = b.tier ?? "Standard";
  if (tier !== "Standard" && tier !== "S") {
    return { ok: false, message: "tier must be 'Standard' or 'S'." };
  }
  const droneTypeId = optStr(b.droneTypeId);
  if (droneTypeId !== null && !UUID_RE.test(droneTypeId)) {
    return { ok: false, message: "droneTypeId must be a valid id." };
  }
  // levelUpBonuses: up to 4 free-text rows; blanks dropped.
  let levelUpBonuses: string[] = [];
  if (b.levelUpBonuses !== undefined) {
    if (!Array.isArray(b.levelUpBonuses) || b.levelUpBonuses.some((x) => typeof x !== "string")) {
      return { ok: false, message: "levelUpBonuses must be an array of strings." };
    }
    // Cap to the 4 form rows first, THEN drop blanks (a blank row 2 shouldn't
    // let row 5 sneak in).
    levelUpBonuses = (b.levelUpBonuses as string[]).slice(0, 4).map((s) => s.trim()).filter((s) => s !== "");
  }
  return {
    ok: true,
    value: {
      name: b.name.trim(),
      iconUrl: optStr(b.iconUrl),
      tier,
      droneTypeId,
      inheritAttack: optStr(b.inheritAttack),
      atk: optStr(b.atk),
      hp: optStr(b.hp),
      def: optStr(b.def),
      previewVideoUrl: optStr(b.previewVideoUrl),
      levelUpBonuses,
    },
  };
}

// P2003 = foreign key violation (droneTypeId points at a missing drone type).
function isMissingDroneType(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";
}

// GET /api/drones — the drone catalog, for admin CRUD.
dronesRouter.get("/", async (_req, res) => {
  const drones = await prisma.drone.findMany({ orderBy: { name: "asc" } });
  res.json(drones);
});

// POST /api/drones
dronesRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseDroneInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const drone = await prisma.drone.create({ data: input.value });
    res.status(201).json(drone);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Drone '${input.value.name}' already exists.` });
    }
    if (isMissingDroneType(err)) return res.status(400).json({ error: "Drone type not found." });
    throw err;
  }
});

// PUT /api/drones/:id
dronesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Drone not found" });
  const input = parseDroneInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const drone = await prisma.drone.update({ where: { id }, data: input.value });
    res.json(drone);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Drone not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Drone '${input.value.name}' already exists.` });
    }
    if (isMissingDroneType(err)) return res.status(400).json({ error: "Drone type not found." });
    throw err;
  }
});

// DELETE /api/drones/:id — nothing references drones yet, so a plain delete.
dronesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Drone not found" });
  try {
    await prisma.drone.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Drone not found" });
    }
    throw err;
  }
});
