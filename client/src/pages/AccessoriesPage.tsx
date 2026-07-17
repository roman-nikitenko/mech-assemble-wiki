import { Link } from "react-router-dom";
import { imageSrc, useAccessories } from "../api/client";
import { RankBadge } from "../components/RankBadge";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";

/** Public accessory list: base attributes for everyone, plus the exclusive
    effect when the accessory is bound to a specific mech. */
export function AccessoriesPage() {
  const { data, isPending, isError, refetch } = useAccessories();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No accessories recorded yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data ?? []).map((a) => (
            <div key={a.id} className="rounded-xl border border-edge bg-surface p-4">
              {a.imageUrl && (
                <img
                  src={imageSrc(a.imageUrl)}
                  alt={a.name}
                  className="mb-2 h-32 w-full rounded-lg border border-edge object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{a.name}</p>
                <RankBadge rank={a.tier} />
              </div>
              {a.attributes.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {a.attributes.map((attr, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="text-ink-dim">{attr.name}</span>
                      <span>{attr.value}</span>
                    </li>
                  ))}
                </ul>
              )}
              {a.exclusiveEffect && a.mech && (
                <p className="mt-2 text-sm">
                  <Link to={`/mechs/${a.mech.id}`} className="text-accent hover:underline">
                    {a.mech.name}
                  </Link>
                  <span className="text-ink-dim"> exclusive: </span>
                  {a.exclusiveEffect}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
