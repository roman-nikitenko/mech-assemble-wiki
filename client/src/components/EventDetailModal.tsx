import { imageSrc } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { categoryInfo } from "../lib/eventCategories";
import { eventWindow, formatInstant, resolveZone } from "../lib/eventDates";
import { EventTimer } from "./EventTimer";
import { Modal } from "./Modal";

// Quality -> tile border colour (the game's tiers). 13 is rainbow; 0 and the two
// values the data has but nobody has named yet (10, 12) fall back to neutral.
const QUALITY_COLORS: Record<number, string> = {
  1: "#9ca3af", 2: "#22c55e", 3: "#3b82f6", 4: "#a855f7", 5: "#f97316", 6: "#ef4444", 7: "#22d3ee", 8: "#facc15",
};
const NEUTRAL = "#475569";
const RAINBOW = "linear-gradient(135deg,#ef4444,#facc15,#22c55e,#22d3ee,#a855f7)";

const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Everything about one event: art header, icon, timer, dates and reward sections. */
export function EventDetailModal({ event, tzChoice, onClose }: { event: CalendarEvent; tzChoice: string; onClose: () => void }) {
  const cat = categoryInfo(event.category);
  const zone = resolveZone(tzChoice);
  const { opensMs, closesMs } = eventWindow(event);
  return (
    <Modal label={event.name} onClose={onClose} closeOnBackdrop panelClassName="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-edge bg-surface shadow-xl">
      <div
        className="relative flex h-36 items-end p-3"
        style={{ background: `linear-gradient(135deg, ${cat.color}, #0b1220 75%)` }}
      >
        {event.backgroundUrl && <img src={imageSrc(event.backgroundUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg/70 text-lg hover:bg-bg">×</button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          {event.iconUrl && <img src={imageSrc(event.iconUrl)} alt="" className="h-14 w-14 shrink-0 object-contain drop-shadow" />}
          <div className="min-w-0">
            <h2 className="text-xl font-black">{event.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: cat.color }}>{cat.label}</span>
              <EventTimer event={event} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-dim">
          {fmtDay(event.startDate)} – {fmtDay(event.endDate)}
          {event.minServerDay !== null && ` · Server day ${event.minServerDay}+`}
        </p>
        {/* The exact moments, on the clock the visitor chose (default: their own). */}
        <p className="mt-1 text-xs text-ink-dim">Opens {formatInstant(opensMs, zone)}</p>
        <p className="text-xs text-ink-dim">Closes {formatInstant(closesMs, zone)}</p>
        {event.featuring && <p className="mt-2 text-sm">Featuring: <b>{event.featuring}</b></p>}

        {event.rewards.map((s, si) => (
          <section key={si} className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-dim">
              {s.section}{s.note ? ` · ${s.note}` : ""}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.items.map((it, ii) => (
                <div key={ii} className="w-16 text-center text-[11px] leading-tight">
                  <div
                    className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-bg p-0.5"
                    style={it.quality === 13 ? { background: RAINBOW } : { border: `2px solid ${QUALITY_COLORS[it.quality] ?? NEUTRAL}` }}
                  >
                    {it.iconUrl ? (
                      <img src={imageSrc(it.iconUrl)} alt="" className="h-full w-full rounded-md bg-bg object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-ink-dim">?</span> // random drop: no art
                    )}
                    {/* A badge only for a guaranteed amount — pools have none. */}
                    {it.amount !== null && (
                      <b className="absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[10px]">×{it.amount.toLocaleString("en-US")}</b>
                    )}
                  </div>
                  <div className="mt-1 break-words">{it.name}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}
