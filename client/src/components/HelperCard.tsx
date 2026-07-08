import type { Helper } from "../api/types";

export function HelperCard({ helper }: { helper: Helper }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{helper.name}</p>
        {helper.passiveEffect && (
          <span className="text-sm text-accent">{helper.passiveEffect}</span>
        )}
      </div>
      {helper.ranks.length > 0 && (
        <ol className="mt-2 space-y-1">
          {helper.ranks.map((r) => (
            <li key={r.id} className="flex gap-2 text-sm">
              <span className="shrink-0 rounded bg-surface-2 px-1.5 text-ink-dim">
                Rank {r.rank}
              </span>
              <span className="text-ink-dim">{r.effect}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
