import { useEffect, useState } from "react";
import type { CalendarEvent } from "../api/types";
import { SERVER_OFFSET_HOURS, timerLabel } from "../lib/eventDates";

/** Countdown next to an event ("3D 13H" green, "Ended" grey, ...). Re-renders every
    second so the HH:MM:SS style really ticks; the interval is cleaned up on unmount. */
export function EventTimer({ event }: { event: CalendarEvent }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const { text, tone } = timerLabel(event, now, SERVER_OFFSET_HOURS);
  return <span className={`font-bold tabular-nums ${tone === "live" ? "text-green-400" : "text-ink-dim"}`}>{text}</span>;
}
