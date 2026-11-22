import { useState } from "react";
import { imageSrc } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { categoryInfo } from "../lib/eventCategories";
import { addDays, daysInMonth } from "../lib/eventDates";

const pad = (n: number) => String(n).padStart(2, "0");
const short = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
// A mouse hover highlights; a finger touch must not (it would stay "hovered" after the tap).
const mouseOnly = (fn: () => void) => (ev: React.PointerEvent) => ev.pointerType === "mouse" && fn();

/** One month as a timeline: a row per event, a column per day, the event drawn as a
    bar across its days. Seasons / Final Raid sit last, dashed. Pure layout — the page
    decides which events to pass in. `today` is a "YYYY-MM-DD" on the server clock.

    The layout is the same on every screen: a name column on the left, the days to its
    right, and a fixed minimum width — so a phone scrolls sideways instead of squashing
    the bars. A row is highlighted (name, bar and background together) while the mouse is
    over it on desktop, or after its name is tapped on a touch screen. */
export function EventTimeline({
  events, year, month, today, onSelect,
}: {
  events: CalendarEvent[];
  year: number;
  /** Zero-based (0 = January). */
  month: number;
  today: string;
  onSelect: (e: CalendarEvent) => void;
}) {
  // Two ways a row gets highlighted: the mouse is over it, or its name was tapped.
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const days = daysInMonth(year, month);
  const first = `${year}-${pad(month + 1)}-01`;
  const last = addDays(first, days - 1);
  const dayIso = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const rows = [...events].sort(
    (a, b) =>
      Number(a.category === "season") - Number(b.category === "season") ||
      a.startDate.localeCompare(b.startDate) ||
      a.name.localeCompare(b.name),
  );

  // One column per day. minmax(0, …) lets the columns shrink to fit a phone screen.
  const dayGrid = { gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` };
  const NAME_W = "w-[150px] shrink-0";

  return (
    <div role="region" aria-label="Event timeline" className="overflow-x-auto rounded-xl border border-edge bg-surface p-3">
      <div className="min-w-[860px] text-xs">
        <div className="flex">
          <div className={NAME_W} />
          <div className="grid flex-1" style={dayGrid}>
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1;
              return (
                <div key={d} className={`py-1 text-center ${dayIso(d) === today ? "font-bold text-red-400" : "text-ink-dim"}`}>{d}</div>
              );
            })}
          </div>
        </div>

        {rows.map((e) => {
          const cat = categoryInfo(e.category);
          const from = e.startDate < first ? 1 : Number(e.startDate.slice(8));
          const to = e.endDate > last ? days : Number(e.endDate.slice(8));
          const isSeason = e.category === "season";
          const lit = hovered === e.id || active === e.id;
          return (
            <div
              key={e.id} data-event-row=""
              data-highlighted={lit ? "true" : undefined}
              onPointerEnter={mouseOnly(() => setHovered(e.id))}
              onPointerLeave={mouseOnly(() => setHovered(null))}
              className={`flex items-center rounded-md ${lit ? "bg-surface-2" : ""}`}
            >
              {/* A button: tap = highlight this event (the touch-screen twin of hovering). */}
              <button
                type="button" aria-label={`Highlight ${e.name}`} aria-pressed={active === e.id} title={e.name}
                onClick={() => setActive(active === e.id ? null : e.id)}
                className={`${NAME_W} cursor-pointer truncate rounded-md py-1 pl-1 pr-2 text-left ${lit ? "font-bold text-accent" : ""}`}
              >
                {e.name}
              </button>

              {/* Day cells (weekend shade + today line) and the bar share one grid row. */}
              <div className="grid flex-1" style={dayGrid}>
                {Array.from({ length: days }, (_, i) => {
                  const iso = dayIso(i + 1);
                  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
                  return (
                    <div
                      key={i}
                      aria-hidden="true"
                      style={{ gridRow: 1, gridColumn: i + 1 }}
                      className={`h-9 border-l border-edge/40 ${dow === 0 || dow === 6 ? "bg-bg/60" : ""} ${iso === today ? "!border-l-2 !border-red-500" : ""}`}
                    />
                  );
                })}
                <button
                  type="button"
                  data-bar-id={e.id}
                  onClick={() => onSelect(e)}
                  style={{
                    gridRow: 1, gridColumn: `${from} / ${to + 1}`, zIndex: 1,
                    background: isSeason ? "transparent" : cat.color,
                    border: isSeason ? `1px dashed ${cat.color}` : undefined,
                  }}
                  className={`my-1 flex h-7 cursor-pointer items-center gap-1 overflow-hidden whitespace-nowrap rounded-md px-1.5 text-left font-semibold text-white hover:brightness-110 ${lit ? "ring-2 ring-white" : ""}`}
                >
                  {e.iconUrl && <img src={imageSrc(e.iconUrl)} alt="" className="h-5 w-5 shrink-0 object-contain drop-shadow" />}
                  <span className="truncate">
                    {e.startDate < first ? "‹ " : ""}{e.name} · {short(e.startDate)}–{short(e.endDate)}{e.endDate > last ? " ›" : ""}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
