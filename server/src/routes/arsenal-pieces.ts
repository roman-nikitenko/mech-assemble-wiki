import { Router } from "express";
import { ArsenalSlot, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

// Final Raid gear pieces. A piece with a setId is "set arsenal", one without
// is "normal arsenal" — there is no separate kind column, so the two can
// never disagree.
export const arsenalPiecesRouter = Router();

// The game's quality ladder runs 1 (Crude) … 13 (Supreme).
const QUALITY_MIN = 1;
const QUALITY_MAX = 13;

// Postgres sorts an enum by its declaration order, so ordering by `slot`
// gives Breastplate → Helmet (the game's order), not alphabetical.
const PIECE_ORDER = [
  { sortOrder: "asc" as const },
  { slot: "asc" as const },
  { name: "asc" as const },
];
// Only the set's id + name: the list shows which set a piece belongs to,
// it never needs the bonuses.
const PIECE_INCLUDE = { include: { set: { select: { id: true, name: true } } } };

// Prisma generates ArsenalSlot as a plain object of the enum's values, which
// gives us the list to validate against without repeating it here.
const SLOTS = Object.values(ArsenalSlot) as string[];

interface PieceInput {
  name: string;
  iconUrl: string | null;
  slot: ArsenalSlot;
  qualityMin: number;
  qualityMax: number;
  setId: string | null;
  sortOrder: number | undefined; // undefined = leave unchanged on PUT
}

function isQuality(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= QUALITY_MIN && value <= QUALITY_MAX;
}

function parsePieceInput(body: unknown): { ok: true; value: PieceInput } | { ok: false; message: string } {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name === "") return { ok: false, message: "A piece needs a name." };

  if (typeof b.slot !== "string" || !SLOTS.includes(b.slot)) {
    return { ok: false, message: `Slot must be one of: ${SLOTS.join(", ")}.` };
  }

  if (!isQuality(b.qualityMin) || !isQuality(b.qualityMax)) {
    return { ok: false, message: `Qualities must be whole numbers from ${QUALITY_MIN} to ${QUALITY_MAX}.` };
  }
  if (b.qualityMin > b.qualityMax) {
    return { ok: false, message: "The lowest quality can't be above the highest." };
  }

  // null, "" or absent all mean "normal arsenal" (no set).
  let setId: string | null = null;
  if (b.setId !== undefined && b.setId !== null && b.setId !== "") {
    if (typeof b.setId !== "string" || !UUID_RE.test(b.setId)) {
      return { ok: false, message: "setId must be a set's id." };
    }
    setId = b.setId;
  }

  const iconUrl = typeof b.iconUrl === "string" && b.iconUrl.trim() !== "" ? b.iconUrl.trim() : null;
  const sortOrder =
    typeof b.sortOrder === "number" && Number.isInteger(b.sortOrder) ? b.sortOrder : undefined;

  return {
    ok: true,
    value: {
      name,
      iconUrl,
      slot: b.slot as ArsenalSlot,
      qualityMin: b.qualityMin,
      qualityMax: b.qualityMax,
      setId,
      sortOrder,
    },
  };
}

/** A set id that doesn't exist would otherwise surface as a raw FK error. */
async function setMissing(setId: string | null): Promise<boolean> {
  if (setId === null) return false;
  return (await prisma.arsenalSet.count({ where: { id: setId } })) === 0;
}

/** P2003 = foreign-key violation: the set was deleted between setMissing()
    and the write. Narrow race, but it's the caller's stale data, not a 500. */
function isSetGoneError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";
}

arsenalPiecesRouter.get("/", async (_req, res) => {
  res.json(await prisma.arsenalPiece.findMany({ orderBy: PIECE_ORDER, ...PIECE_INCLUDE }));
});

arsenalPiecesRouter.post("/", requireAdmin, async (req, res) => {
  const input = parsePieceInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  if (await setMissing(input.value.setId)) {
    return res.status(400).json({ error: "That set no longer exists." });
  }
  try {
    const { sortOrder, ...fields } = input.value;
    const created = await prisma.arsenalPiece.create({
      data: { ...fields, sortOrder: sortOrder ?? 0 },
      ...PIECE_INCLUDE,
    });
    res.status(201).json(created);
  } catch (err) {
    if (isSetGoneError(err)) return res.status(400).json({ error: "That set no longer exists." });
    throw err;
  }
});

arsenalPiecesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Piece not found." });

  const input = parsePieceInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  if (await setMissing(input.value.setId)) {
    return res.status(400).json({ error: "That set no longer exists." });
  }

  try {
    const { sortOrder, ...fields } = input.value;
    const updated = await prisma.arsenalPiece.update({
      where: { id },
      data: { ...fields, ...(sortOrder !== undefined ? { sortOrder } : {}) },
      ...PIECE_INCLUDE,
    });
    res.json(updated);
  } catch (err) {
    if (isSetGoneError(err)) return res.status(400).json({ error: "That set no longer exists." });
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Piece not found." });
    }
    throw err;
  }
});

arsenalPiecesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Piece not found." });
  try {
    await prisma.arsenalPiece.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Piece not found." });
    }
    throw err;
  }
});
