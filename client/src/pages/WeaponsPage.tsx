import { Link } from "react-router-dom";
import { imageSrc, useWeapons } from "../api/client";
import { RankBadge } from "../components/RankBadge";
import { TypeBadge } from "../components/TypeBadge";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";

/** Public weapon list. There is no weapon detail page yet — a weapon's full
    kit (skills, skins, helpers) lives on its owner mech's Weapon tab, so the
    owner link is the way in. */
export function WeaponsPage() {
  const { data, isPending, isError, refetch } = useWeapons();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No weapons recorded yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data ?? []).map((w) => (
            <div key={w.id} className="rounded-xl border border-edge bg-surface p-4">
              {w.imageUrl && (
                <img
                  src={imageSrc(w.imageUrl)}
                  alt={w.name}
                  className="mb-2 h-32 w-full rounded-lg border border-edge object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{w.name}</p>
                <RankBadge rank={w.tier} />
              </div>
              {w.description && <p className="mt-1 text-sm text-ink-dim">{w.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {w.type && <TypeBadge type={w.type} />}
                {w.mech && (
                  <Link
                    to={`/mechs/${w.mech.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    {w.mech.name}&rsquo;s weapon →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
