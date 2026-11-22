import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { parseAssetBulk } from "../lib/event-input";

// Registry of imported event art: the game's image name -> our uploaded file URL.
// Admin-only (it is only used by the import dialog). See the EventAsset model.
export const eventAssetsRouter = Router();

eventAssetsRouter.get("/", requireAdmin, async (_req, res) => {
  const rows = await prisma.eventAsset.findMany({ select: { key: true, url: true }, orderBy: { key: "asc" } });
  res.json(rows);
});

// POST /api/event-assets/bulk — body { assets: [{key, url}] }. Upsert by key, in one
// transaction, so re-registering an icon just points it at the newer file.
eventAssetsRouter.post("/bulk", requireAdmin, async (req, res) => {
  const input = parseAssetBulk(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  await prisma.$transaction(
    input.value.map((a) =>
      prisma.eventAsset.upsert({ where: { key: a.key }, create: a, update: { url: a.url } }),
    ),
  );
  res.json({ saved: input.value.length });
});
