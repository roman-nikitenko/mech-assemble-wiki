import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

// Final Raid gear sets. Modelled on accessory-sets.ts, minus the member list:
// arsenal pieces will point AT their set (a set_id column on the piece), so the
// set itself only carries its name, emblem and the two bonus sentences.
export const arsenalSetsRouter = Router();

const SET_ORDER = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

interface SetInput {
  name: string;
  iconUrl: string | null;
  twoPieceBonus: string | null;
  fourPieceBonus: string | null;
  // `undefined` = the caller did not send one, so PUT leaves the stored value
  // alone (the admin editor never sends it — see accessory-sets.ts for the
  // bug this avoids).
  sortOrder: number | undefined;
}

/** Trimmed text, or null for anything blank or not a string. */
function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function parseSetInput(body: unknown): { ok: true; value: SetInput } | { ok: false; message: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name === "") return { ok: false, message: "A set needs a name." };

  const sortOrder =
    typeof b.sortOrder === "number" && Number.isInteger(b.sortOrder) ? b.sortOrder : undefined;
  return {
    ok: true,
    value: {
      name,
      iconUrl: optionalText(b.iconUrl),
      twoPieceBonus: optionalText(b.twoPieceBonus),
      fourPieceBonus: optionalText(b.fourPieceBonus),
      sortOrder,
    },
  };
}

arsenalSetsRouter.get("/", async (_req, res) => {
  const rows = await prisma.arsenalSet.findMany({
    orderBy: SET_ORDER,
    include: { _count: { select: { pieces: true } } },
  });
  // Flatten Prisma's `_count: { pieces }` into a plain pieceCount field.
  res.json(rows.map(({ _count, ...set }) => ({ ...set, pieceCount: _count.pieces })));
});

arsenalSetsRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseSetInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  try {
    const { sortOrder, ...fields } = input.value;
    // A brand-new row has nothing to preserve, so an absent sortOrder is 0.
    const created = await prisma.arsenalSet.create({ data: { ...fields, sortOrder: sortOrder ?? 0 } });
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "A set with that name already exists." });
    }
    throw err;
  }
});

arsenalSetsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Set not found." });

  const input = parseSetInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });

  try {
    const { sortOrder, ...fields } = input.value;
    const updated = await prisma.arsenalSet.update({
      where: { id },
      // Only write sortOrder when one was actually sent.
      data: { ...fields, ...(sortOrder !== undefined ? { sortOrder } : {}) },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "A set with that name already exists." });
      }
      // P2025 = no row with that id (never existed, or deleted from another tab).
      if (err.code === "P2025") return res.status(404).json({ error: "Set not found." });
    }
    throw err;
  }
});

// DELETE is BLOCKED while pieces still belong to the set (like types). We
// count them ourselves for a friendly message; the FK's onDelete: Restrict
// is the backstop if a piece is added between the count and the delete.
arsenalSetsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Set not found." });
  const set = await prisma.arsenalSet.findUnique({ where: { id }, select: { name: true } });
  if (!set) return res.status(404).json({ error: "Set not found." });

  const pieceCount = await prisma.arsenalPiece.count({ where: { setId: id } });
  if (pieceCount > 0) {
    return res.status(409).json({
      error: `Cannot delete '${set.name}' — ${pieceCount} piece(s) still belong to it. Move or delete them first.`,
    });
  }
  try {
    await prisma.arsenalSet.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2003 = the Restrict backstop fired; P2025 = deleted from another tab.
      if (err.code === "P2003") {
        return res.status(409).json({ error: `Cannot delete '${set.name}' — it is in use.` });
      }
      if (err.code === "P2025") return res.status(404).json({ error: "Set not found." });
    }
    throw err;
  }
});
