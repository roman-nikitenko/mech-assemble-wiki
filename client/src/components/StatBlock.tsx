import type { Stats } from "../api/types";

// "critRate" -> "Crit Rate" for display.
function prettify(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/** Renders a flexible JSON stat object ({"atk": 120, "critRate": 0.03})
    as a label/value grid. Null-safe: renders nothing when there are no stats. */
export function StatBlock({ stats }: { stats: Stats | null }) {
  if (!stats || Object.keys(stats).length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Object.entries(stats).map(([key, value]) => (
        <div
          key={key}
          className="flex justify-between gap-2 rounded bg-surface-2 px-2 py-1 text-sm"
        >
          <dt className="text-ink-dim">{prettify(key)}</dt>
          <dd className="font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
