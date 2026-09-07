import { useState } from "react";

interface AircraftQuality {
  /** The ladder position as the game labels it: Q1 … Q13. */
  tier: string;
  name: string;
  levelCap: number;
  shards: number;
  // Flat stats are kept apart rather than as one pre-written string, so the
  // display can format the thousands separators and skip the tiers that grant
  // nothing (Q1). null = this tier grants none of that stat.
  hp: number | null;
  atk: number | null;
  def: number | null;
}

// Fixed game reference data, deliberately hardcoded rather than admin-managed:
// the ladder is the same for every aircraft, so there is nothing to enter per
// row. If the game rebalances these numbers, edit them here.
export const AIRCRAFT_QUALITIES: AircraftQuality[] = [
  { tier: "Q1", name: "Crude", levelCap: 1, shards: 5, hp: null, atk: null, def: null },
  { tier: "Q2", name: "Common", levelCap: 1, shards: 10, hp: 50, atk: 10, def: 5 },
  { tier: "Q3", name: "Uncommon", levelCap: 1, shards: 20, hp: 100, atk: 20, def: 10 },
  { tier: "Q4", name: "Excellent", levelCap: 20, shards: 50, hp: 200, atk: 40, def: 20 },
  { tier: "Q5", name: "Rare", levelCap: 40, shards: 100, hp: 500, atk: 100, def: 50 },
  { tier: "Q6", name: "Epic", levelCap: 80, shards: 200, hp: 1000, atk: 200, def: 100 },
  { tier: "Q7", name: "Legendary", levelCap: 140, shards: 400, hp: 2000, atk: 400, def: 200 },
  { tier: "Q8", name: "Mythic", levelCap: 200, shards: 600, hp: 3000, atk: 600, def: 300 },
  { tier: "Q9", name: "Mythic+1", levelCap: 260, shards: 1000, hp: 6000, atk: 1200, def: 600 },
  { tier: "Q10", name: "Mythic+2", levelCap: 320, shards: 1400, hp: 9000, atk: 1800, def: 900 },
  { tier: "Q11", name: "Mythic+3", levelCap: 380, shards: 1800, hp: 12000, atk: 2400, def: 1200 },
  { tier: "Q12", name: "Mythic+4", levelCap: 440, shards: 2200, hp: 15000, atk: 3000, def: 1500 },
  { tier: "Q13", name: "Supreme", levelCap: 500, shards: 3000, hp: 20000, atk: 4000, def: 2000 },
];

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
