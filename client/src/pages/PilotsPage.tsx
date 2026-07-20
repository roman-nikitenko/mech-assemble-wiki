import { Link } from "react-router-dom";
import { imageSrc, usePilots } from "../api/client";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";

/** Public pilot list: portrait, boosts, and where the pilot serves
    (a mech's cockpit OR fronting a weapon — never both). */
export function PilotsPage() {
  const { data, isPending, isError, refetch } = usePilots();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No pilots recorded yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data ?? []).map((p) => (
            <div key={p.id} className="rounded-xl border border-edge bg-surface p-4">
              <div className="flex items-center gap-3">
                {p.iconUrl && (
                  <img
                    src={imageSrc(p.iconUrl)}
                    alt={p.name}
                    className="h-14 w-14 rounded-full border border-edge object-cover"
                  />
                )}
                <div>
                  <p className="font-bold">{p.name}</p>
                  {p.mech && (
                    <Link
                      to={`/mechs/${p.mech.id}`}
                      className="text-xs text-accent hover:underline"
                    >
                      pilots {p.mech.name} →
                    </Link>
                  )}
                  {p.weapon && (
                    <p className="text-xs text-ink-dim">wields {p.weapon.name}</p>
                  )}
                </div>
              </div>
              {p.unlockBoost && (
                <p className="mt-2 text-sm">
                  <span className="text-ink-dim">Unlock: </span>
                  {p.unlockBoost}
                </p>
              )}
              {p.relationshipBonus && (
                <p className="mt-1 text-sm">
                  <span className="text-ink-dim">Relationship: </span>
                  {p.relationshipBonus}
                </p>
              )}
              {p.bonusPerLevel.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {p.bonusPerLevel.map((bonus, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 text-accent">Lv.{i + 1}</span>
                      <span className="text-ink-dim">{bonus}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
