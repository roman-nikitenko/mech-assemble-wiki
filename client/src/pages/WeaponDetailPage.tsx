import { Link, useParams } from "react-router-dom";
import { imageSrc, NotFoundError, useWeapon } from "../api/client";
import { TypeBadge } from "../components/TypeBadge";
import { RankBadge } from "../components/RankBadge";
import { StatBlock } from "../components/StatBlock";
import { WeaponKit } from "../components/WeaponKit";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";

export function WeaponDetailPage() {
  // The route is /weapons/:id, so id is always present; "!" tells TS that.
  const { id } = useParams<{ id: string }>();
  const { data: weapon, isPending, isError, error, refetch } = useWeapon(id!);

  if (isPending) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <LoadingSkeleton variant="detail" />
      </main>
    );
  }

  if (isError && error instanceof NotFoundError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Weapon not found</h1>
        <Link to="/weapons" className="mt-2 inline-block text-accent underline">
          All weapons
        </Link>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <ErrorPanel onRetry={() => refetch()} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/weapons" className="text-sm text-ink-dim hover:text-accent">
        ← All weapons
      </Link>

      <header className="mt-3 mb-5">
        {weapon.imageUrl && (
          <img
            src={imageSrc(weapon.imageUrl)}
            alt={weapon.name}
            className="mb-4 h-48 w-48 rounded-xl border border-edge object-cover"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">{weapon.name}</h1>
          <RankBadge rank={weapon.tier} />
          {weapon.type && <TypeBadge type={weapon.type} />}
        </div>
        {weapon.description && <p className="mt-1 text-ink-dim">{weapon.description}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-dim">
          {weapon.mech && (
            <Link to={`/mechs/${weapon.mech.id}`} className="text-accent hover:underline">
              {weapon.mech.name}&rsquo;s mech →
            </Link>
          )}
          {weapon.pilot && (
            <span>
              Pilot: <span className="text-ink">{weapon.pilot.name}</span>
            </span>
          )}
        </div>
        {weapon.rankUpPreview.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {weapon.rankUpPreview.map((step, i) => (
              <span
                key={i}
                className="rounded-lg border border-edge bg-surface px-2 py-1 text-xs text-ink-dim"
              >
                {step}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-6">
        <StatBlock stats={weapon.baseStats} />
        <WeaponKit weapon={weapon} />
      </div>
    </main>
  );
}
