import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const traitsRouter = Router();

// GET /api/traits — the catalog, for the admin form's trait picker.
traitsRouter.get("/", async (_req, res) => {
  const traits = await prisma.trait.findMany({ orderBy: { name: "asc" } });
  res.json(traits);
});

// POST /api/traits — create a trait. The app's first WRITE endpoint.
// ⚠️ No auth yet (deliberate, local-only) — must be protected before deploy.
traitsRouter.post("/", async (req, res) => {
  const { name, color } = req.body ?? {};
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Trait name is required." });
  }
  if (color !== undefined && color !== null && typeof color !== "string") {
    return res.status(400).json({ error: "Trait color must be a string." });
  }
  try {
    const trait = await prisma.trait.create({
      data: { name: name.trim(), color: color ?? null },
    });
    res.status(201).json(trait);
  } catch (err) {
    // P2002 = Prisma's "unique constraint violated" — the name is taken.
    // 409 Conflict tells the client this is a data clash, not a bad request.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: `Trait '${name.trim()}' already exists.` });
    }
    throw err; // anything else -> the app's 500 handler
  }
});
