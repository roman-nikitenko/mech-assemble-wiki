// Date helpers for the event calendar. No date library on purpose (the project has
// none): events are plain "YYYY-MM-DD" days, so a few small UTC helpers are enough.
//
// "Server time": the game's daily reset happens at 02:00 (winter) / 03:00 (summer)
// Kyiv time, which is exactly 00:00 UTC — so the server clock IS UTC. The offset
// parameters below stay (so the maths is testable for any offset), but the app always
// passes SERVER_OFFSET_HOURS. What the visitor chooses is only the zone used to DISPLAY
// the moments an event opens/closes (see TZ_PRESETS); countdowns are the same everywhere.
// To keep the maths simple we shift "now" by the offset and then read it with the UTC
// getters — the shifted value is "what the server's wall clock says".

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const TZ_KEY = "evcal-tz";

/** The game server's UTC offset in hours (see the note above). */
export const SERVER_OFFSET_HOURS = 0;

/** The part of an event the date helpers need (CalendarEvent satisfies it). */
export interface Dated {
  startDate: string;
  endDate: string;
}

const dayMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Today's date ("YYYY-MM-DD") on the server clock for the chosen offset. */
export function todayIso(offsetHours: number, now: Date = new Date()): string {
  return new Date(now.getTime() + offsetHours * HOUR).toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  return new Date(dayMs(iso) + n * DAY).toISOString().slice(0, 10);
}

/** `month` is zero-based (0 = January), like JavaScript's Date. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function overlapsMonth(e: Dated, year: number, month: number): boolean {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = addDays(first, daysInMonth(year, month) - 1);
  return e.startDate <= last && e.endDate >= first;
}

export type EventStatus = "running" | "upcoming" | "ended";

/** ISO dates compare correctly as plain strings. `today` comes from todayIso(). */
export function eventStatus(e: Dated, today: string): EventStatus {
  if (e.endDate < today) return "ended";
  if (e.startDate > today) return "upcoming";
  return "running";
}

export interface Timer {
  text: string;
  /** "live" = green (counting down), "muted" = grey (not started / over). */
  tone: "live" | "muted";
}

const two = (n: number) => String(n).padStart(2, "0");

/** The countdown shown next to an event. An event opens 00:00 on its start day and
    closes 00:00 the day AFTER its end day (end is inclusive). */
export function timerLabel(e: Dated, nowMs: number, offsetHours: number): Timer {
  const serverNow = nowMs + offsetHours * HOUR;
  const opens = dayMs(e.startDate);
  const closes = dayMs(e.endDate) + DAY;

  if (serverNow >= closes) return { text: "Ended", tone: "muted" };
  if (serverNow < opens) {
    const left = opens - serverNow;
    const d = Math.floor(left / DAY);
    const h = Math.floor((left % DAY) / HOUR);
    if (d > 0) return { text: `in ${d}D ${h}H`, tone: "muted" };
    return { text: `in ${h}H ${Math.floor((left % HOUR) / 60_000)}M`, tone: "muted" };
  }
  const left = closes - serverNow;
  if (left >= DAY) {
    return { text: `${Math.floor(left / DAY)}D ${Math.floor((left % DAY) / HOUR)}H`, tone: "live" };
  }
  const s = Math.floor(left / 1000);
  return { text: `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`, tone: "live" };
}

/** The moments an event opens and closes, as absolute times (ms since epoch). The
    server clock is UTC, so 00:00 server time on the start day, and 00:00 the day
    AFTER the end day (end is inclusive). */
export function eventWindow(e: Dated): { opensMs: number; closesMs: number } {
  return { opensMs: dayMs(e.startDate) - SERVER_OFFSET_HOURS * HOUR, closesMs: dayMs(e.endDate) + DAY - SERVER_OFFSET_HOURS * HOUR };
}

/** "22 Nov, 02:00 GMT+2" — one moment written on the clock of an IANA zone. */
export function formatInstant(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone, timeZoneName: "short",
  }).format(new Date(ms));
}

/** What a visitor can pick under "Show times in". "local" = auto-detect from the browser. */
export const TZ_PRESETS: { value: string; label: string }[] = [
  { value: "local", label: "My local time" },
  { value: "UTC", label: "Server time (UTC)" },
  { value: "Europe/Kyiv", label: "Ukraine (Kyiv)" },
  { value: "Europe/Berlin", label: "Central Europe" },
  { value: "America/New_York", label: "US East" },
  { value: "America/Los_Angeles", label: "US West" },
  { value: "Asia/Shanghai", label: "China" },
  { value: "Asia/Tokyo", label: "Japan" },
];

/** The browser's own zone (what "local" means), e.g. "Europe/Kyiv". */
export const detectedZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Turns a saved choice into an IANA zone name for Intl. */
export const resolveZone = (choice: string): string => (choice === "local" ? detectedZone() : choice);

/** Saved choice; "local" (auto-detect) on a first visit, when unknown, or when storage is blocked. */
export function readTzChoice(): string {
  try {
    const v = localStorage.getItem(TZ_KEY);
    return TZ_PRESETS.some((p) => p.value === v) ? (v as string) : "local";
  } catch {
    return "local"; // storage blocked (privacy settings): don't crash the page
  }
}

export function saveTzChoice(choice: string): void {
  try {
    localStorage.setItem(TZ_KEY, choice);
  } catch {
    // Not remembering the choice is fine; breaking the page is not.
  }
}
