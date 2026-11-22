// Validation for calendar events. Hand-written (like chip-input.ts): the rewards
// are jsonb, so the database cannot check their shape — this file is the only
// guard between a bad import file and the public calendar. Every message is plain
// English because the admin form / import dialog shows it as-is.

export const EVENT_CATEGORIES = ["draw", "guild", "explore", "rank", "shop", "season"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// App-level sanity ceilings (the real export is far inside them).
const MAX_NAME = 120;
const MAX_TEXT = 300;
const MAX_SECTIONS = 12;
const MAX_ITEMS_PER_SECTION = 40;
const MAX_OTHER_BACKGROUNDS = 20;
const MAX_SERVER_DAY = 10000;
const MAX_QUALITY = 100;
export const MAX_IMPORT_EVENTS = 200;
const MAX_ASSETS_PER_CALL = 500;

export interface RewardItem {
  name: string;
  /** null = a pool of possible items (shop / prize pool), not a guaranteed amount. */
  amount: number | null;
  quality: number;
  iconUrl: string | null;
}
export interface RewardSection {
  section: string;
  note: string | null;
  items: RewardItem[];
}
export interface EventInput {
  /** The game's own run id — the import's upsert key. null for hand-typed events. */
  gameId: number | null;
  name: string;
  category: EventCategory;
  /** YYYY-MM-DD; endDate is the LAST day (inclusive). */
  startDate: string;
  endDate: string;
  minServerDay: number | null;
  featuring: string | null;
  iconUrl: string | null;
  backgroundUrl: string | null;
  otherBackgrounds: string[];
  rewards: RewardSection[];
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };
const fail = (message: string): { ok: false; message: string } => ({ ok: false, message });
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Strict YYYY-MM-DD that is also a REAL day ("2026-02-30" parses in JS but rolls
// over to March, so we round-trip it to catch that).
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// Images are only ever our own uploads (or empty) — never a remote URL.
function imageUrl(v: unknown, label: string): ParseResult<string | null> {
  if (v === undefined || v === null) return { ok: true, value: null };
  if (typeof v !== "string") return fail(`${label} must be text.`);
  const t = v.trim();
  if (t === "") return { ok: true, value: null };
  if (!t.startsWith("/uploads/")) return fail(`${label} must be an uploaded file (/uploads/...).`);
  return { ok: true, value: t };
}

function optionalText(v: unknown, label: string, max: number): ParseResult<string | null> {
  if (v === undefined || v === null) return { ok: true, value: null };
  if (typeof v !== "string") return fail(`${label} must be text.`);
  const t = v.trim();
  if (t.length > max) return fail(`${label} is at most ${max} characters.`);
  return { ok: true, value: t === "" ? null : t };
}

function parseItem(raw: unknown, where: string): ParseResult<RewardItem | null> {
  if (!isRecord(raw)) return fail(`${where}: every reward item must be an object.`);
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  // A blank row is what the form's "+ Add item" button leaves behind: drop it.
  if (name === "") return { ok: true, value: null };
  if (name.length > MAX_NAME) return fail(`${where}: an item name is at most ${MAX_NAME} characters.`);

  let amount: number | null = null;
  if (raw.amount !== undefined && raw.amount !== null) {
    if (typeof raw.amount !== "number" || !Number.isInteger(raw.amount) || raw.amount < 0) {
      return fail(`${where}: "${name}" amount must be a whole number or empty.`);
    }
    amount = raw.amount;
  }
  const quality = raw.quality ?? 0;
  if (typeof quality !== "number" || !Number.isInteger(quality) || quality < 0 || quality > MAX_QUALITY) {
    return fail(`${where}: "${name}" quality must be a whole number.`);
  }
  const icon = imageUrl(raw.iconUrl, `${where}: "${name}" icon`);
  if (!icon.ok) return icon;
  return { ok: true, value: { name, amount, quality, iconUrl: icon.value } };
}

function parseSection(raw: unknown, index: number): ParseResult<RewardSection | null> {
  if (!isRecord(raw)) return fail(`Reward section #${index + 1} must be an object.`);
  const title = typeof raw.section === "string" ? raw.section.trim() : "";
  const where = `Reward section "${title || `#${index + 1}`}"`;
  if (raw.items !== undefined && !Array.isArray(raw.items)) return fail(`${where}: items must be an array.`);
  const items: RewardItem[] = [];
  for (const it of (raw.items as unknown[] | undefined) ?? []) {
    const parsed = parseItem(it, where);
    if (!parsed.ok) return parsed;
    if (parsed.value) items.push(parsed.value);
  }
  if (items.length > MAX_ITEMS_PER_SECTION) return fail(`${where}: at most ${MAX_ITEMS_PER_SECTION} items.`);
  if (title === "" && items.length === 0) return { ok: true, value: null }; // empty shell
  if (title === "") return fail(`${where} needs a title.`);
  if (title.length > MAX_NAME) return fail(`${where}: the title is at most ${MAX_NAME} characters.`);
  const note = optionalText(raw.note, `${where} note`, MAX_TEXT);
  if (!note.ok) return note;
  return { ok: true, value: { section: title, note: note.value, items } };
}

/** Validates one event as sent by the admin form (POST/PUT) or inside an import. */
export function parseEventInput(body: unknown): ParseResult<EventInput> {
  if (!isRecord(body)) return fail("Send the event as a JSON object.");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name === "") return fail("An event needs a name.");
  if (name.length > MAX_NAME) return fail(`An event name is at most ${MAX_NAME} characters.`);

  if (typeof body.category !== "string" || !(EVENT_CATEGORIES as readonly string[]).includes(body.category)) {
    return fail(`Category must be one of ${EVENT_CATEGORIES.join(", ")}.`);
  }
  if (!isIsoDate(body.startDate)) return fail("Start date must be a real date like 2026-11-01.");
  if (!isIsoDate(body.endDate)) return fail("End date must be a real date like 2026-11-07.");
  // ISO dates sort the same as calendar dates, so string comparison is enough.
  if (body.endDate < body.startDate) return fail("The end date can't be before the start date.");

  let gameId: number | null = null;
  if (body.gameId !== undefined && body.gameId !== null) {
    if (typeof body.gameId !== "number" || !Number.isInteger(body.gameId) || body.gameId < 0) {
      return fail("gameId must be a whole number.");
    }
    gameId = body.gameId;
  }
  let minServerDay: number | null = null;
  if (body.minServerDay !== undefined && body.minServerDay !== null) {
    const m = body.minServerDay;
    if (typeof m !== "number" || !Number.isInteger(m) || m < 0 || m > MAX_SERVER_DAY) {
      return fail("Minimum server day must be a whole number.");
    }
    minServerDay = m;
  }

  const featuring = optionalText(body.featuring, "Featuring", MAX_TEXT);
  if (!featuring.ok) return featuring;
  const iconUrl = imageUrl(body.iconUrl, "Icon");
  if (!iconUrl.ok) return iconUrl;
  const backgroundUrl = imageUrl(body.backgroundUrl, "Background");
  if (!backgroundUrl.ok) return backgroundUrl;

  if (body.otherBackgrounds !== undefined && !Array.isArray(body.otherBackgrounds)) {
    return fail("otherBackgrounds must be an array.");
  }
  const otherBackgrounds: string[] = [];
  for (const b of (body.otherBackgrounds as unknown[] | undefined) ?? []) {
    const u = imageUrl(b, "Extra background");
    if (!u.ok) return u;
    if (u.value) otherBackgrounds.push(u.value); // blanks dropped
  }
  if (otherBackgrounds.length > MAX_OTHER_BACKGROUNDS) {
    return fail(`At most ${MAX_OTHER_BACKGROUNDS} extra backgrounds.`);
  }

  if (body.rewards !== undefined && !Array.isArray(body.rewards)) return fail("rewards must be an array.");
  const rawSections = (body.rewards as unknown[] | undefined) ?? [];
  const rewards: RewardSection[] = [];
  for (let i = 0; i < rawSections.length; i++) {
    const parsed = parseSection(rawSections[i], i);
    if (!parsed.ok) return parsed;
    if (parsed.value) rewards.push(parsed.value);
  }
  if (rewards.length > MAX_SECTIONS) return fail(`At most ${MAX_SECTIONS} reward sections.`);

  return {
    ok: true,
    value: {
      gameId, name, category: body.category as EventCategory,
      startDate: body.startDate, endDate: body.endDate, minServerDay,
      featuring: featuring.value, iconUrl: iconUrl.value, backgroundUrl: backgroundUrl.value,
      otherBackgrounds, rewards,
    },
  };
}

/** Validates an import body `{ events: [...] }` — every event or nothing. */
export function parseEventImport(body: unknown): ParseResult<EventInput[]> {
  if (!isRecord(body) || !Array.isArray(body.events)) return fail("Send { \"events\": [ ... ] }.");
  if (body.events.length === 0) return fail("The file has no events.");
  if (body.events.length > MAX_IMPORT_EVENTS) return fail(`At most ${MAX_IMPORT_EVENTS} events per import.`);

  const out: EventInput[] = [];
  const seen = new Set<number>();
  for (const raw of body.events) {
    const parsed = parseEventInput(raw);
    if (!parsed.ok) {
      const label = isRecord(raw) && typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : `#${out.length + 1}`;
      return fail(`Event ${label}: ${parsed.message}`);
    }
    // Two rows with the same game id would fight over one upsert key.
    if (parsed.value.gameId !== null) {
      if (seen.has(parsed.value.gameId)) return fail(`Event id ${parsed.value.gameId} appears twice in the file.`);
      seen.add(parsed.value.gameId);
    }
    out.push(parsed.value);
  }
  return { ok: true, value: out };
}

export interface AssetInput {
  key: string;
  url: string;
}

/** Validates `{ assets: [{key, url}] }` for the image registry. */
export function parseAssetBulk(body: unknown): ParseResult<AssetInput[]> {
  if (!isRecord(body) || !Array.isArray(body.assets)) return fail("Send { \"assets\": [ ... ] }.");
  if (body.assets.length > MAX_ASSETS_PER_CALL) return fail(`At most ${MAX_ASSETS_PER_CALL} assets per call.`);
  const out: AssetInput[] = [];
  for (const a of body.assets) {
    if (!isRecord(a) || typeof a.key !== "string" || a.key.trim() === "") return fail("Every asset needs a key.");
    const url = imageUrl(a.url, `Asset ${a.key}`);
    if (!url.ok) return url;
    if (url.value === null) return fail(`Asset ${a.key} needs a url.`);
    out.push({ key: a.key.trim(), url: url.value });
  }
  return { ok: true, value: out };
}
