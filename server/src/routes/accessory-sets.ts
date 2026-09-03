import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

export const accessorySetsRouter = Router();

// Members carry their own order, and the accessory rows come along so the
// public page can render icons without a second request.
//
// `orderBy` is split out from `include` because Prisma only accepts a
// top-level `orderBy` on findMany — spreading it into create()/update() as
// well (which only accept `include`/`select`) throws a validation error.
const SET_ORDER = [{ sortOrder: "asc" as const }, { name: "asc" as const }];
const SET_INCLUDE = {
  include: {
    members: {
      orderBy: { position: "asc" as const },
      include: {
        accessory: {
          // `attributes` feeds the public tile's popover ("Basic Attr."); the
          // rest of an accessory row — exclusiveEffect, mech, slug — is
          // deliberately left out, since a set only ever renders a small card.
          select: {
            id: true,
            name: true,
            tier: true,
            iconUrl: true,
            imageUrl: true,
            attributes: true,
          },
        },
      },
    },
  },
};

type SetRow = Prisma.AccessorySetGetPayload<typeof SET_INCLUDE>;

/** Flattens the join rows away — callers want a set with `accessories`, not
    with `members` each wrapping an accessory. */
function formatSet(row: SetRow) {
  return {
    id: row.id,
    name: row.name,
    bonus: row.bonus,
    sortOrder: row.sortOrder,
    accessories: row.members.map((m) => m.accessory),
  };
}

interface SetInput {
  name: string;
  bonus: string | null;
  // `undefined` means the caller did not send a sortOrder at all — distinct
  // from sending 0. The admin editor never sends this field, so treating
  // "absent" as "reset to 0" would silently clobber any value set by hand
  // (or by a future reorder UI) on every single save. PUT below only writes
  // this when it is present; POST defaults a genuinely new row to 0.
  sortOrder: number | undefined;
  accessoryIds: string[];
}

function parseSetInput(body: unknown): { ok: true; value: SetInput } | { ok: false; message: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name === "") return { ok: false, message: "A set needs a name." };

  if (b.accessoryIds !== undefined && !Array.isArray(b.accessoryIds)) {
    return { ok: false, message: "accessoryIds must be an array." };
  }
  const raw = (b.accessoryIds as unknown[] | undefined) ?? [];
  const ids: string[] = [];
  for (const id of raw) {
    if (typeof id !== "string" || !UUID_RE.test(id)) {
      return { ok: false, message: "Every accessory id must be a UUID." };
    }
    // A piece listed twice is a slip in the editor, not an error worth
    // rejecting the whole save for — keep the first occurrence.
    if (!ids.includes(id)) ids.push(id);
  }

  const bonus = typeof b.bonus === "string" && b.bonus.trim() !== "" ? b.bonus.trim() : null;
  const sortOrder =
    typeof b.sortOrder === "number" && Number.isInteger(b.sortOrder) ? b.sortOrder : undefined;
  return { ok: true, value: { name, bonus, sortOrder, accessoryIds: ids } };
}

/** Every id must exist, or the set would render with silent gaps. */
async function missingAccessory(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return false;
  const found = await prisma.accessory.count({ where: { id: { in: ids } } });
  return found !== ids.length;
}

accessorySetsRouter.get("/", async (_req, res) => {
  const rows = await prisma.accessorySet.findMany({ orderBy: SET_ORDER, ...SET_INCLUDE });
  res.json(rows.map(formatSet));
});

accessorySetsRouter.post("/", requireAdmin, async (req, res) => {
  const input = parseSetInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  if (await missingAccessory(input.value.accessoryIds)) {
    return res.status(400).json({ error: "One of those accessories no longer exists." });
  }
  try {
    const created = await prisma.accessorySet.create({
      data: {
        name: input.value.name,
        bonus: input.value.bonus,
        // A brand-new row has no previous sortOrder to preserve, so an
        // absent value defaults to 0 here (unlike PUT, see SetInput above).
        sortOrder: input.value.sortOrder ?? 0,
        members: {
          create: input.value.accessoryIds.map((accessoryId, position) => ({ accessoryId, position })),
        },
      },
      ...SET_INCLUDE,
    });
    res.status(201).json(formatSet(created));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "A set with that name already exists." });
    }
    throw err;
  }
});

accessorySetsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Set not found." });
  const exists = await prisma.accessorySet.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return res.status(404).json({ error: "Set not found." });

  const input = parseSetInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.message });
  if (await missingAccessory(input.value.accessoryIds)) {
    return res.status(400).json({ error: "One of those accessories no longer exists." });
  }

  try {
    // Replace-the-set on members, same contract as mech skins: the editor
    // always submits the whole list, so delete-then-recreate keeps this simple.
    const updated = await prisma.$transaction(async (tx) => {
      await tx.accessorySetMember.deleteMany({ where: { setId: id } });
      return tx.accessorySet.update({
        where: { id },
        data: {
          name: input.value.name,
          bonus: input.value.bonus,
          // Absent sortOrder means "leave it unchanged" — the admin editor
          // never sends this field, so writing it unconditionally would
          // reset any hand-set (or future reorder-UI-set) value to 0 on
          // every single save. Only include the key when a value was sent.
          ...(input.value.sortOrder !== undefined ? { sortOrder: input.value.sortOrder } : {}),
          members: {
            create: input.value.accessoryIds.map((accessoryId, position) => ({ accessoryId, position })),
          },
        },
        ...SET_INCLUDE,
      });
    });
    res.json(formatSet(updated));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "A set with that name already exists." });
      }
      // P2025 = the row vanished between the existence check above and this
      // update — someone deleted the set from another tab mid-save. Narrow
      // race, but it is still a "gone", not a server fault, so say so.
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Set not found." });
      }
    }
    throw err;
  }
});

accessorySetsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Set not found." });
  const exists = await prisma.accessorySet.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return res.status(404).json({ error: "Set not found." });
  // Members cascade; the accessories themselves are untouched.
  await prisma.accessorySet.delete({ where: { id } });
  res.status(204).end();
});
