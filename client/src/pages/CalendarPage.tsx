import { useState } from "react";
import { imageSrc, useEvents } from "../api/client";
import type { CalendarEvent, EventCategory } from "../api/types";
import { ErrorPanel } from "../components/ErrorPanel";
import { EventDetailModal } from "../components/EventDetailModal";
import { EventTimeline } from "../components/EventTimeline";
import { EventTimer } from "../components/EventTimer";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { Seo } from "../components/Seo";
import { EVENT_CATEGORIES, categoryInfo, readHiddenCategories, saveHiddenCategories } from "../lib/eventCategories";
import {
  SERVER_OFFSET_HOURS, TZ_PRESETS, addDays, detectedZone, eventStatus, overlapsMonth, readTzChoice, saveTzChoice, todayIso,
} from "../lib/eventDates";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SOON_DAYS = 14;

function EventRow({ e, onSelect }: { e: CalendarEvent; onSelect: (e: CalendarEvent) => void }) {
  const cat = categoryInfo(e.category);
  return (
    <button
      type="button"
      onClick={() => onSelect(e)}
      style={{ borderLeftColor: cat.color }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-edge border-l-4 bg-surface px-3 py-2 text-left hover:border-accent/60"
    >
      {e.iconUrl && <img src={imageSrc(e.iconUrl)} alt="" className="h-8 w-8 shrink-0 object-contain" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{e.name}</span>
        <span className="block text-xs text-ink-dim">{e.startDate} → {e.endDate}</span>
      </span>
      <EventTimer event={e} />
    </button>
  );
}

/** Public Calendar tab: running / starting-soon lists, then a month timeline. */
export function CalendarPage() {
  const { data, isPending, isError, refetch } = useEvents();
  const [tzChoice, setTzChoice] = useState(readTzChoice);
  const [hidden, setHidden] = useState<EventCategory[]>(readHiddenCategories);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  // "Today" is the SERVER's today (UTC) — the timeline's days are server days. The
  // time-zone preset below only changes how open/close moments are written.
  const today = todayIso(SERVER_OFFSET_HOURS);
  const [view, setView] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }));

  function shiftMonth(delta: number) {
    setView(({ year, month }) => {
      const m = month + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }
  function toggle(c: EventCategory) {
    const next = hidden.includes(c) ? hidden.filter((x) => x !== c) : [...hidden, c];
    setHidden(next);
    saveHiddenCategories(next);
  }
  function changeTz(choice: string) {
    setTzChoice(choice);
    saveTzChoice(choice);
  }

  const shown = (data ?? []).filter((e) => !hidden.includes(e.category));
  const inMonth = shown.filter((e) => overlapsMonth(e, view.year, view.month));
  // Seasons are background info, not things to "join", so the lists skip them.
  const joinable = shown.filter((e) => e.category !== "season");
  const running = joinable.filter((e) => eventStatus(e, today) === "running").sort((a, b) => a.endDate.localeCompare(b.endDate));
  const soonLimit = addDays(today, SOON_DAYS);
  const soon = joinable
    .filter((e) => eventStatus(e, today) === "upcoming" && e.startDate <= soonLimit)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const monthTitle = `${MONTHS[view.month]} ${view.year}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Event Calendar — Mech Assemble Wiki"
        description="Every Mech Assemble: Zombie Swarm event — running now, starting soon and past — with dates, timers and full reward lists."
        path="/calendar"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Event Calendar</h1>
        <label className="flex items-center gap-2 text-sm text-ink-dim">
          Show times in
          <select
            value={tzChoice}
            onChange={(e) => changeTz(e.target.value)}
            className="min-h-11 rounded-lg border border-edge bg-surface px-2 text-ink"
          >
            {TZ_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.value === "local" ? `${p.label} (${detectedZone()})` : p.label}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-1 text-xs text-ink-dim">The timeline shows server days (UTC) — the game resets at 00:00 UTC, which is 02:00 Kyiv in winter and 03:00 in summer.</p>

      <div role="group" aria-label="Filter by category" className="mt-4 flex flex-wrap gap-2">
        {EVENT_CATEGORIES.map((c) => {
          const on = !hidden.includes(c.value);
          return (
            <button
              key={c.value} type="button" aria-pressed={on} onClick={() => toggle(c.value)}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${on ? "border-edge bg-surface" : "border-edge/50 text-ink-dim opacity-60"}`}
            >
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
              {c.label}
            </button>
          );
        })}
      </div>

      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section aria-label="Running now">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">Running now</h2>
              <div className="space-y-2">
                {running.map((e) => <EventRow key={e.id} e={e} onSelect={setSelected} />)}
                {running.length === 0 && <p className="text-sm text-ink-dim">Nothing is running right now.</p>}
              </div>
            </section>
            <section aria-label="Starting soon">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">Starting soon</h2>
              <div className="space-y-2">
                {soon.map((e) => <EventRow key={e.id} e={e} onSelect={setSelected} />)}
                {soon.length === 0 && <p className="text-sm text-ink-dim">Nothing starts in the next {SOON_DAYS} days.</p>}
              </div>
            </section>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className="min-h-11 min-w-11 cursor-pointer rounded-lg border border-edge hover:border-accent/60">‹</button>
            <h2 className="text-xl font-bold">{monthTitle}</h2>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className="min-h-11 min-w-11 cursor-pointer rounded-lg border border-edge hover:border-accent/60">›</button>
          </div>
          <div className="mt-3">
            {inMonth.length === 0 ? (
              <p className="rounded-xl border border-edge bg-surface p-6 text-center text-ink-dim">No events in {monthTitle}.</p>
            ) : (
              <EventTimeline events={inMonth} year={view.year} month={view.month} today={today} onSelect={setSelected} />
            )}
          </div>
        </>
      )}

      {selected && <EventDetailModal event={selected} tzChoice={tzChoice} onClose={() => setSelected(null)} />}
    </main>
  );
}
