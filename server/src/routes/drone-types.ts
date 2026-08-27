import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

export const droneTypesRouter = Router();

// Inline validation — drone types are just {name, iconUrl?} (same as types).
function parseDroneTypeInput(
  body: unknown
): { ok: true; value: { name: string; iconUrl: string | null } } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Drone type name is required." };
  }
  if (b.iconUrl !== undefined && b.iconUrl !== null && typeof b.iconUrl !== "string") {
    return { ok: false, message: "iconUrl must be a string." };
  }
  return {
    ok: true,
    value: { name: b.name.trim(), iconUrl: (b.iconUrl as string | null | undefined) ?? null },
  };
}

// GET /api/drone-types — the drone element catalog, for admin CRUD.
droneTypesRouter.get("/", async (_req, res) => {
  const droneTypes = await prisma.droneType.findMany({ orderBy: { name: "asc" } });
  res.json(droneTypes);
});

// POST /api/drone-types
droneTypesRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseDroneTypeInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const droneType = await prisma.droneType.create({ data: input.value });
    res.status(201).json(droneType);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Drone type '${input.value.name}' already exists.` });
    }
    throw err;
  }
});

// PUT /api/drone-types/:id
droneTypesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Drone type not found" });
  const input = parseDroneTypeInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const droneType = await prisma.droneType.update({ where: { id }, data: input.value });
    res.json(droneType);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Drone type not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Drone type '${input.value.name}' already exists.` });
    }
    throw err;
  }
});

// DELETE /api/drone-types/:id — nothing references drone types yet, so a plain delete.
droneTypesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Drone type not found" });
  try {
    await prisma.droneType.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Drone type not found" });
    }
    throw err;
  }
});
