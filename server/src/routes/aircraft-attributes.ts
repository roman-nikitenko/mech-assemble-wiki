import { Router } from "express";
import { prisma } from "../lib/prisma";

export const aircraftAttributesRouter = Router();

// GET /api/aircraft-attributes — the aircraft reset-effect catalog, grouped.
//
// Read-only, so unlike routes/aircraft.ts this router has no write handlers and
// no input parser: the rows are seeded by the add_aircraft_attributes migration
// and there is no admin CRUD for them.
//
// Attributes come back nested under their group because that is the shape the
// future 5-slot picker wants (a grouped dropdown), and because the caps live on
// the group — sending them flat would make the client re-join.
aircraftAttributesRouter.get("/", async (_req, res) => {
  const groups = await prisma.aircraftAttributeGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      attributes: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });
  res.json(groups);
});
