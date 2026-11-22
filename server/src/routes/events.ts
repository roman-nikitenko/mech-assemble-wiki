import { Router } from "express";
import { Prisma } from "@prisma/client";
import type { Event } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";
import { isIsoDate, parseEventImport, parseEventInput, type EventInput } from "../lib/event-input";

// Calendar events. Public GET; admin writes; POST /import upserts by the game's run id.
export const eventsRouter = Router();

// Postgres DATE columns come back as JS Dates at UTC midnight; the client only
// wants the plain "YYYY-MM-DD" day, so we serialise them ourselves.
const day = (d: Date) => d.toISOString().slice(0, 10);
const serialize = (e: Event) => ({
  id: e.id,
  gameId: e.gameId,
  name: e.name,
  category: e.category,
  startDate: day(e.startDate),
  endDate: day(e.endDate),
  minServerDay: e.minServerDay,
  featuring: e.featuring,
  iconUrl: e.iconUrl,
  backgroundUrl: e.backgroundUrl,
  otherBackgrounds: e.otherBackgrounds,
  rewards: e.rewards,
});

// `rewards` is a typed array in our code but Prisma's Json input type is stricter,
// so we double-cast (same as chips.qualities).
const toData = (e: EventInput) => ({
  gameId: e.gameId,
  name: e.name,
  category: e.category,
  startDate: new Date(`${e.startDate}T00:00:00Z`),
  endDate: new Date(`${e.endDate}T00:00:00Z`),
  minServerDay: e.minServerDay,
  featuring: e.featuring,
  iconUrl: e.iconUrl,
  backgroundUrl: e.backgroundUrl,
  otherBackgrounds: e.otherBackgrounds,
  rewards: e.rewards as unknown as Prisma.InputJsonValue,
});

// GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD — events that OVERLAP the range
// (start <= to AND end >= from), so an event spanning a month boundary shows in
// both months. Without a range everything is returned.
eventsRouter.get("/", async (req, res) => {
  const { from, to } = req.query;
  const where: Prisma.EventWhereInput = {};
  if (from !== undefined || to !== undefined) {
    if (!isIsoDate(from) || !isIsoDate(to)) {
      return res.status(400).json({ error: "from and to must both be dates like 2026-11-01." });
    }
    where.startDate = { lte: new Date(`${to}T00:00:00Z`) };
    where.endDate = { gte: new Date(`${from}T00:00:00Z`) };
  }
  const rows = await prisma.event.findMany({ where, orderBy: [{ startDate: "asc" }, { name: "asc" }] });
  res.json(rows.map(serialize));
});

// On an import UPDATE, an image that came in empty (the key had no registered file this
// time) must not erase a picture that is already there — e.g. one an admin set by hand
// after the first import. The edit form (PUT) still replaces everything, so an admin
// can clear an image deliberately.
const toImportUpdate = (e: EventInput) => {
  const { iconUrl, backgroundUrl, otherBackgrounds, ...rest } = toData(e);
  return {
    ...rest,
    ...(iconUrl !== null && { iconUrl }),
    ...(backgroundUrl !== null && { backgroundUrl }),
    ...(otherBackgrounds.length > 0 && { otherBackgrounds }),
  };
};

// POST /api/events/import — body { events: [...] }. All-or-nothing in one transaction.
// Rows with a gameId are upserted by it (re-running a file updates, never duplicates).
// Hand-made rows (no gameId, e.g. our own Export JSON) are matched by name + start
// date, so re-importing a backup into the same database updates them too.
eventsRouter.post("/import", requireAdmin, async (req, res) => {
  const input = parseEventImport(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  const ids = input.value.map((e) => e.gameId).filter((g): g is number => g !== null);
  const existing = await prisma.event.findMany({ where: { gameId: { in: ids } }, select: { gameId: true } });
  const existingIds = new Set(existing.map((e) => e.gameId));

  // For rows without a gameId: the id of the matching hand-made row, if there is one.
  const manualMatch = new Map<EventInput, string>();
  for (const e of input.value) {
    if (e.gameId !== null) continue;
    const hit = await prisma.event.findFirst({
      where: { gameId: null, name: e.name, startDate: new Date(`${e.startDate}T00:00:00Z`) },
      select: { id: true },
    });
    if (hit) manualMatch.set(e, hit.id);
  }

  await prisma.$transaction(
    input.value.map((e) => {
      if (e.gameId !== null) {
        return prisma.event.upsert({ where: { gameId: e.gameId }, create: toData(e), update: toImportUpdate(e) });
      }
      const matchId = manualMatch.get(e);
      return matchId
        ? prisma.event.update({ where: { id: matchId }, data: toImportUpdate(e) })
        : prisma.event.create({ data: toData(e) });
    }),
  );

  const updated = input.value.filter((e) => (e.gameId !== null ? existingIds.has(e.gameId) : manualMatch.has(e))).length;
  res.json({ created: input.value.length - updated, updated });
});

const conflict = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

eventsRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseEventInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    res.status(201).json(serialize(await prisma.event.create({ data: toData(input.value) })));
  } catch (err) {
    if (conflict(err)) return res.status(409).json({ error: "An event with that game id already exists." });
    throw err;
  }
});

eventsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Event not found." });
  const input = parseEventInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    res.json(serialize(await prisma.event.update({ where: { id }, data: toData(input.value) })));
  } catch (err) {
    if (conflict(err)) return res.status(409).json({ error: "An event with that game id already exists." });
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Event not found." });
    }
    throw err;
  }
});

eventsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Event not found." });
  try {
    await prisma.event.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Event not found." });
    }
    throw err;
  }
});
