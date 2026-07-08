import type { AwakeningLevel } from "../../api/types";
import { StatBlock } from "../../components/StatBlock";

export function AwakenTab({ levels }: { levels: AwakeningLevel[] }) {
  return (
    <div className="space-y-4">
      {levels.map((lvl) => (
        <section key={lvl.id} className="rounded-xl border border-edge bg-surface/50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">Level {lvl.level}</h2>
            {lvl.requirement && (
              <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-ink-dim">
                {lvl.requirement}
              </span>
            )}
          </div>
          {lvl.specialEffect && (
            <p className="mt-1 text-sm text-accent">{lvl.specialEffect}</p>
          )}
          <div className="mt-3">
            <StatBlock stats={lvl.statBonus} />
          </div>
          {lvl.nodes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {lvl.nodes.map((n) => (
                <span
                  key={n.id}
                  className="rounded-lg border border-edge bg-surface px-2 py-1 text-xs"
                >
                  <span className="mr-1 text-ink-dim">{n.position}</span>
                  {n.attribute}
                </span>
              ))}
            </div>
          )}
          {lvl.unlocks.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {lvl.unlocks.map((u) => (
                <li key={u.id}>
                  <span className="text-accent">Unlocks:</span>{" "}
                  <span className="font-semibold">{u.name}</span>
                  {u.description && (
                    <span className="text-ink-dim"> — {u.description}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
