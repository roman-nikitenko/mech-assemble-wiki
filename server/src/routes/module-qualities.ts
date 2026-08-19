import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";
import { parseModuleQualityInput } from "../lib/module-quality-input";

export const moduleQualitiesRouter = Router();

// GET /api/module-qualities — the catalog, ordered for the ladder + dropdowns.
moduleQualitiesRouter.get("/", async (_req, res) => {
  const qualities = await prisma.moduleQuality.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  res.json(qualities);
});

moduleQualitiesRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseModuleQualityInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const quality = await prisma.moduleQuality.create({ data: input.value });
    res.status(201).json(quality);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Quality '${input.value.name}' already exists.` });
    }
    throw err;
  }
});

moduleQualitiesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Quality not found" });
  const input = parseModuleQualityInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const quality = await prisma.moduleQuality.update({ where: { id }, data: input.value });
    res.json(quality);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Quality not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Quality '${input.value.name}' already exists.` });
    }
    throw err;
  }
});

// DELETE — Restricted (P2003) when any module still has effects at this quality.
moduleQualitiesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Quality not found" });
  try {
    await prisma.moduleQuality.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Quality not found" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return res.status(409).json({ error: "This quality is used by a module. Clear those module effects first." });
    }
    throw err;
  }
});
