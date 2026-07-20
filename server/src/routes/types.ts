import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

export const typesRouter = Router();

// Inline validation — types are just {name, iconUrl?}; a separate lib file
// would be ceremony.
function parseTypeInput(
  body: unknown
): { ok: true; value: { name: string; iconUrl: string | null } } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Type name is required." };
  }
  if (b.iconUrl !== undefined && b.iconUrl !== null && typeof b.iconUrl !== "string") {
    return { ok: false, message: "iconUrl must be a string." };
  }
  return {
    ok: true,
    value: { name: b.name.trim(), iconUrl: (b.iconUrl as string | null | undefined) ?? null },
  };
}

// GET /api/types — the element catalog, for admin CRUD and form dropdowns.
typesRouter.get("/", async (_req, res) => {
  const types = await prisma.type.findMany({ orderBy: { name: "asc" } });
  res.json(types);
});

// POST /api/types
typesRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseTypeInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const type = await prisma.type.create({ data: input.value });
    res.status(201).json(type);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Type '${input.value.name}' already exists.` });
    }
    throw err;
  }
});

// PUT /api/types/:id
typesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Type not found" });
  const input = parseTypeInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const type = await prisma.type.update({ where: { id }, data: input.value });
    res.json(type);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Type not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Type '${input.value.name}' already exists.` });
    }
    throw err;
  }
});

// DELETE /api/types/:id — BLOCKED while anything uses the type. We count
// usage ourselves for a friendly message; the DB's onDelete: Restrict is the
// backstop if something slips in between the count and the delete.
typesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Type not found" });
  const type = await prisma.type.findUnique({ where: { id } });
  if (!type) return res.status(404).json({ error: "Type not found" });

  const [mechCount, weaponCount] = await Promise.all([
    prisma.mech.count({ where: { typeId: id } }),
    prisma.weapon.count({ where: { typeId: id } }),
  ]);
  if (mechCount > 0 || weaponCount > 0) {
    return res.status(409).json({
      error: `Cannot delete '${type.name}' — used by ${mechCount} mech(s) and ${weaponCount} weapon(s).`,
    });
  }
  try {
    await prisma.type.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    // P2003 = foreign key violation: the Restrict backstop fired.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return res.status(409).json({ error: `Cannot delete '${type.name}' — it is in use.` });
    }
    throw err;
  }
});
