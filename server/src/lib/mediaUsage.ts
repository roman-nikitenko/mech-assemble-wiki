import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Which records point at which uploaded file. Powers the Media library's
// "Used by" panel, its search-by-owner, the warning before a delete, and the
// clean-up AFTER a delete (clearing the now-dead reference).
//
// There is no join table for this: every record just stores the file's URL
// ("/uploads/<uuid>.webp") in a plain string column, so "is this image in use?"
// means scanning those columns. It's ~15 tiny queries and admin-only, so we
// simply run them on demand instead of maintaining a separate index.

export interface MediaUsage {
  /** Human label for the kind of record: "Mech", "Weapon skin", ... */
  kind: string;
  id: string;
  name: string;
  /** Which column holds the image: "imageUrl", "iconUrl", ... */
  field: string;
  /** Admin page where the record can be edited. */
  editPath: string;
}

type Row = Record<string, unknown> & { id: string; name: string };

// The two Prisma calls we make on every model. Each model has its own typed
// delegate (prisma.mech, prisma.weapon, ...); this is the part they share, so
// ONE list below can drive both finding and clearing. The price is looser
// typing here — worth it, because the alternative is two parallel lists of
// columns that someone must remember to keep in sync.
interface Delegate {
  findMany(args: { select: Record<string, true> }): Promise<Row[]>;
  updateMany(args: { where: Record<string, unknown>; data: Record<string, null> }): Promise<unknown>;
}
const delegate = (d: unknown) => d as Delegate;

interface Source {
  kind: string;
  model: Delegate;
  /** The columns that hold an uploaded file's URL. ALL nullable strings. */
  fields: string[];
  /** Extra columns needed to build the edit link (a skin links to its parent). */
  extra?: string[];
  editPath: (row: Row) => string;
}

// THE list of every column in the database that can hold an uploaded file.
// Adding an image column to the schema? Add it here, or its files will look
// "unused" in the Media library and deleting them will leave a dead URL behind.
const SOURCES: Source[] = [
  { kind: "Mech", model: delegate(prisma.mech), fields: ["imageUrl", "iconUrl", "cardSkillIconUrl"], editPath: (r) => `/admin/mechs/${r.id}/edit` },
  { kind: "Pilot", model: delegate(prisma.pilot), fields: ["iconUrl", "backgroundUrl"], editPath: (r) => `/admin/pilots/${r.id}/edit` },
  { kind: "Weapon", model: delegate(prisma.weapon), fields: ["imageUrl", "iconUrl"], editPath: (r) => `/admin/weapons/${r.id}/edit` },
  // Skins are edited inside their parent's form, so they link there.
  { kind: "Weapon skin", model: delegate(prisma.weaponSkin), fields: ["imageUrl"], extra: ["weaponId"], editPath: (r) => `/admin/weapons/${r.weaponId}/edit` },
  { kind: "Mech skin", model: delegate(prisma.skin), fields: ["imageUrl"], extra: ["mechId"], editPath: (r) => `/admin/mechs/${r.mechId}/edit` },
  { kind: "Accessory", model: delegate(prisma.accessory), fields: ["imageUrl", "iconUrl"], editPath: (r) => `/admin/accessories/${r.id}/edit` },
  { kind: "Aircraft", model: delegate(prisma.aircraft), fields: ["imageUrl"], editPath: (r) => `/admin/aircraft/${r.id}/edit` },
  { kind: "Drone", model: delegate(prisma.drone), fields: ["iconUrl", "previewVideoUrl"], editPath: (r) => `/admin/drones/${r.id}/edit` },
  { kind: "Type", model: delegate(prisma.type), fields: ["iconUrl"], editPath: (r) => `/admin/types/${r.id}/edit` },
  { kind: "Drone type", model: delegate(prisma.droneType), fields: ["iconUrl"], editPath: (r) => `/admin/drone-types/${r.id}/edit` },
  { kind: "Module", model: delegate(prisma.module), fields: ["iconUrl"], editPath: (r) => `/admin/modules/${r.id}/edit` },
  { kind: "Module quality", model: delegate(prisma.moduleQuality), fields: ["iconUrl"], editPath: (r) => `/admin/module-qualities/${r.id}/edit` },
  { kind: "Arsenal set", model: delegate(prisma.arsenalSet), fields: ["iconUrl"], editPath: (r) => `/admin/final-raid/sets/${r.id}/edit` },
  { kind: "Arsenal piece", model: delegate(prisma.arsenalPiece), fields: ["iconUrl"], editPath: (r) => `/admin/final-raid/arsenal/${r.id}/edit` },
  { kind: "Hidden achievement", model: delegate(prisma.hiddenAchievement), fields: ["iconUrl"], editPath: (r) => `/admin/final-raid/achievements/${r.id}/edit` },
];

/** Map of stored URL ("/uploads/<file>") -> every record using it. */
export async function findMediaUsage(): Promise<Map<string, MediaUsage[]>> {
  const byUrl = new Map<string, MediaUsage[]>();
  const perSource = await Promise.all(
    SOURCES.map(async (s) => {
      const select: Record<string, true> = { id: true, name: true };
      for (const col of [...s.fields, ...(s.extra ?? [])]) select[col] = true;
      return { s, rows: await s.model.findMany({ select }) };
    }),
  );
  for (const { s, rows } of perSource) {
    for (const row of rows) {
      for (const field of s.fields) {
        const url = row[field];
        if (typeof url !== "string" || !url) continue;
        const usage: MediaUsage = { kind: s.kind, id: row.id, name: row.name, field, editPath: s.editPath(row) };
        const list = byUrl.get(url);
        if (list) list.push(usage);
        else byUrl.set(url, [usage]);
      }
    }
  }
  return byUrl;
}

/** Empty every column that holds any of `urls`, so deleting those files leaves
    no record pointing at a missing image. Only the image FIELD is cleared — the
    mech, weapon, etc. itself is never deleted. Takes a list so a bulk delete is
    one all-or-nothing transaction (~25 updates) instead of one per file. */
export async function clearMediaUsage(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  await prisma.$transaction(
    SOURCES.flatMap((s) =>
      s.fields.map((field) => s.model.updateMany({ where: { [field]: { in: urls } }, data: { [field]: null } })),
    ) as unknown as Prisma.PrismaPromise<unknown>[],
  );
}
