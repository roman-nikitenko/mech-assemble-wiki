import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { imageSrc, useEvents } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { categoryInfo } from "../lib/eventCategories";
import { SERVER_OFFSET_HOURS, addDays, daysInMonth, eventStatus, readTzChoice, todayIso } from "../lib/eventDates";
import { EventDetailModal } from "./EventDetailModal";
import { EventTimer } from "./EventTimer";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: number) => String(n).padStart(2, "0");

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" />
    </svg>
  );
}

/** The month agenda: one row per event overlapping the shown month. Mounted only
    while the popup is open, so the month is fetched only when someone looks. */
function MonthList({ onSelect, onNavigate }: { onSelect: (e: CalendarEvent) => void; onNavigate: () => void }) {
  const today = todayIso(SERVER_OFFSET_HOURS);
  const [view, setView] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
  const from = `${view.year}-${pad(view.month + 1)}-01`;
  const to = addDays(from, daysInMonth(view.year, view.month) - 1);
  const { data, isPending, isError } = useEvents({ from, to });
  const title = `${MONTHS[view.month]} ${view.year}`;
  const isCurrentMonth = view.year === Number(today.slice(0, 4)) && view.month === Number(today.slice(5, 7)) - 1;

  function shift(delta: number) {
    setView(({ year, month }) => {
      const m = month + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  // Only what is still relevant: ended events are hidden (the Calendar tab keeps the
  // full history). An event that ends TODAY still counts as running.
  const rows = (data ?? []).filter((e) => eventStatus(e, today) !== "ended").sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button" aria-label="Previous month" onClick={() => shift(-1)}
          // Earlier months can only hold ended events, which this popup hides.
          disabled={isCurrentMonth}
          className="h-9 w-9 cursor-pointer rounded-lg border border-edge hover:border-accent/60 disabled:cursor-default disabled:opacity-30"
        >‹</button>
        <b>{title}</b>
        <button type="button" aria-label="Next month" onClick={() => shift(1)} className="h-9 w-9 cursor-pointer rounded-lg border border-edge hover:border-accent/60">›</button>
      </div>
      <div className="max-h-[55vh] space-y-1.5 overflow-y-auto">
        {isPending && <p className="py-4 text-center text-sm text-ink-dim">Loading…</p>}
        {isError && <p className="py-4 text-center text-sm text-fire">Couldn't load events.</p>}
        {data && rows.length === 0 && <p className="py-4 text-center text-sm text-ink-dim">No running or upcoming events in {title}.</p>}
        {rows.map((e) => (
          <button
            key={e.id} type="button" onClick={() => onSelect(e)}
            style={{ borderLeftColor: categoryInfo(e.category).color }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-edge border-l-4 bg-bg px-2 py-1.5 text-left hover:border-accent/60"
          >
            {e.iconUrl && <img src={imageSrc(e.iconUrl)} alt="" className="h-7 w-7 shrink-0 object-contain" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{e.name}</span>
              <span className="block text-xs text-ink-dim">{e.startDate.slice(5)} → {e.endDate.slice(5)}</span>
            </span>
            <span className="text-xs"><EventTimer event={e} /></span>
          </button>
        ))}
      </div>
      <Link to="/calendar" onClick={onNavigate} className="mt-3 block text-center text-sm text-accent hover:underline">
        Open full calendar →
      </Link>
    </>
  );
}

/** Header calendar icon + month popup (variant "agenda list"). */
export function CalendarPopup() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [top, setTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Read when the detail card is opened, so a change made on the Calendar page is picked up.

  // Keyboard users: the panel lives at the end of <body>, so Tab from the icon would
  // not reach it. Move focus into it on open (the "Previous month" button is its first
  // control), and hand focus back to the icon when it closes.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);
  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  // Close on Escape or a click outside — but not while the detail card is up
  // (it is its own dialog with its own Escape handling).
  useEffect(() => {
    if (!open || selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false); // the click chose a new focus target itself
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, selected]);

  function toggle() {
    // The header sits UNDER the page body (z-10 vs z-20), so a panel inside it would
    // be painted behind the page. We render it in a portal on <body> and place it
    // under the icon ourselves.
    if (!open) setTop((buttonRef.current?.getBoundingClientRect().bottom ?? 0) + 8);
    setOpen((o) => !o);
  }

  return (
    <>
      <button
        ref={buttonRef} type="button" aria-label="Event calendar" aria-expanded={open} aria-haspopup="dialog" onClick={toggle}
        className="flex cursor-pointer items-center rounded-lg border border-accent px-2 py-1 text-ink hover:text-accent"
      >
        <CalendarIcon className="h-5 w-5" />
      </button>

      {open && createPortal(
        <div
          ref={panelRef} role="dialog" aria-label="Events this month" tabIndex={-1} style={{ top }}
          className="fixed right-2 z-40 w-[min(92vw,380px)] rounded-xl border border-edge bg-surface p-3 shadow-2xl sm:right-4"
        >
          <MonthList
            onSelect={(e) => { setSelected(e); setOpen(false); }}
            onNavigate={() => setOpen(false)}
          />
        </div>,
        document.body,
      )}

      {selected && createPortal(
        <EventDetailModal
          event={selected} tzChoice={readTzChoice()}
          // Modal restores focus to whatever was focused when it opened — which, after the
          // popup closed under it, is <body>. So we send focus to the icon ourselves.
          onClose={() => { setSelected(null); buttonRef.current?.focus(); }}
        />,
        document.body,
      )}
    </>
  );
}
