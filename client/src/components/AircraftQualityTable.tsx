import { useState } from "react";
import { AIRCRAFT_QUALITIES, type AircraftQuality } from "../lib/aircraftQualities";


// "en-US" explicitly, not the visitor's locale: the game writes these numbers
// with comma separators, and a German browser would otherwise show "1.000".
function num(value: number): string {
  return value.toLocaleString("en-US");
}

function flatStats(q: AircraftQuality): string {
  const parts: string[] = [];
  if (q.hp !== null) parts.push(`HP +${num(q.hp)}`);
  if (q.atk !== null) parts.push(`ATK +${num(q.atk)}`);
  if (q.def !== null) parts.push(`DEF +${num(q.def)}`);
  return parts.length > 0 ? parts.join(", ") : "—";
}

const headCls = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-dim";

/** The aircraft quality ladder (Q1 → Q13): level cap, shard cost and the flat
    stats each tier grants. Same for every aircraft, so it sits above the list.
    Collapsed to a single bar by default — it's reference data most visitors
    only want occasionally, and 13 rows would push the aircraft off the screen. */
export function AircraftQualityTable() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-edge">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="quality-ladder"
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 bg-surface px-4 py-3 text-sm font-bold uppercase tracking-wider text-ink-dim hover:text-ink"
        >
          Quality Ladder
          {/* Rotates to point down when the table is open. */}
          <span
            aria-hidden
            className={`transition-transform ${open ? "rotate-90" : ""}`}
          >
            ▶
          </span>
        </button>
      </h2>

      {/* The table scrolls inside its own box rather than widening the page. */}
      <div id="quality-ladder" className="overflow-x-auto border-t border-edge" hidden={!open}>
        <table className="w-full min-w-[560px] bg-surface-2 text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th scope="col" className={headCls}>Tier</th>
              <th scope="col" className={headCls}>Name</th>
              <th scope="col" className={`${headCls} text-right`}>Level Cap</th>
              <th scope="col" className={`${headCls} text-right`}>Shards</th>
              <th scope="col" className={headCls}>Flat Stats</th>
            </tr>
          </thead>
          <tbody>
            {AIRCRAFT_QUALITIES.map((q) => (
              <tr key={q.tier} className="border-t border-edge">
                <th scope="row" className="px-4 py-2 font-semibold text-ink-dim">
                  {q.tier}
                </th>
                <td className="px-4 py-2 font-semibold">{q.name}</td>
                {/* tabular-nums keeps the digits in vertical columns. */}
                <td className="px-4 py-2 text-right tabular-nums">{num(q.levelCap)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{num(q.shards)}</td>
                <td className="px-4 py-2 text-ink-dim">{flatStats(q)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
