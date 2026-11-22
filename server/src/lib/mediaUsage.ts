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
  // Events: only the plain columns fit this list. Their extra backgrounds (a text[])
  // and reward icons (inside the `rewards` jsonb) are handled separately below.
  { kind: "Event", model: delegate(prisma.event), fields: ["iconUrl", "backgroundUrl"], editPath: (r) => `/admin/events/${r.id}/edit` },
];

// Shape of the reward sections inside events.rewards (see lib/event-input.ts).
type RewardSections = { items?: { iconUrl?: string | null }[] }[];
const rewardSections = (v: unknown): RewardSections => (Array.isArray(v) ? (v as RewardSections) : []);

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

  // Events' extra backgrounds + reward icons live in an array / jsonb, so the loop
  // above can't see them. Without this a reward icon used only inside an event would
  // look "unused" in the Media library and could be deleted without a warning.
  const add = (url: unknown, usage: MediaUsage) => {
    if (typeof url !== "string" || !url) return;
    const list = byUrl.get(url);
    if (list) list.push(usage);
    else byUrl.set(url, [usage]);
  };
  for (const e of await prisma.event.findMany({ select: { id: true, name: true, otherBackgrounds: true, rewards: true } })) {
    const base = { kind: "Event", id: e.id, name: e.name, editPath: `/admin/events/${e.id}/edit` };
    for (const url of e.otherBackgrounds) add(url, { ...base, field: "otherBackgrounds" });
    for (const section of rewardSections(e.rewards)) {
      for (const item of section.items ?? []) add(item.iconUrl, { ...base, field: "rewards" });
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
  const gone = new Set(urls);

  // Events keep some urls inside an array / jsonb, which updateMany can't edit, so
  // rewrite those rows in JS (a few dozen events — cheap) and save only changed ones.
  const events = await prisma.event.findMany({ select: { id: true, otherBackgrounds: true, rewards: true } });
  for (const e of events) {
    const others = e.otherBackgrounds.filter((u) => !gone.has(u));
    const sections = rewardSections(e.rewards);
    let rewardsChanged = false;
    for (const section of sections) {
      for (const item of section.items ?? []) {
        if (item.iconUrl && gone.has(item.iconUrl)) {
          item.iconUrl = null; // keep the reward, drop only its dead icon
          rewardsChanged = true;
        }
      }
    }
    if (others.length !== e.otherBackgrounds.length || rewardsChanged) {
      await prisma.event.update({
        where: { id: e.id },
        data: { otherBackgrounds: others, rewards: sections as unknown as Prisma.InputJsonValue },
      });
    }
  }
  // A registry entry pointing at a deleted file would make the next import reuse a
  // dead url, so drop it — the import then asks for the image again.
  await prisma.eventAsset.deleteMany({ where: { url: { in: urls } } });

  await prisma.$transaction(
    SOURCES.flatMap((s) =>
      s.fields.map((field) => s.model.updateMany({ where: { [field]: { in: urls } }, data: { [field]: null } })),
    ) as unknown as Prisma.PrismaPromise<unknown>[],
  );
}
