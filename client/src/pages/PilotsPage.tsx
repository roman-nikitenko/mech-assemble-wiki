import { Link } from "react-router-dom";
import { imageSrc, srcSet, usePilots } from "../api/client";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { Gem } from "../components/Gem";
import { Seo } from "../components/Seo";

/** Public pilot list: portrait, boosts, and where the pilot serves
    (a mech's cockpit OR fronting a weapon — never both). */
export function PilotsPage() {
  const { data, isPending, isError, refetch } = usePilots();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Pilots — Mech Assemble Wiki"
        description="All pilots in Mech Assemble: Zombie Swarm — their boosts, relationship bonuses, and the mech or weapon they serve."
        path="/pilots"
      />
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No pilots recorded yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {(data ?? []).map((p) => {
            // A pilot links to a mech OR a weapon (never both) — normalize the
            // two shapes into one clickable target for the icon row.
            const linked = p.mech
              ? { to: `/mechs/${p.mech.id}`, name: p.mech.name, iconUrl: p.mech.iconUrl }
              : p.weapon
                ? { to: `/weapons/${p.weapon.id}`, name: p.weapon.name, iconUrl: p.weapon.iconUrl }
                : null;

            return (
              <div key={p.id} className="rounded-xl border border-edge bg-surface p-4 pb-0 overflow-hidden">
                {/* Header: portrait + name, then the unlock boost as plain text. */}
                <div className="flex items-center gap-3">
                  {p.iconUrl && (
                    <img
                      src={imageSrc(p.iconUrl)}
                      srcSet={srcSet(p.iconUrl)}
                      sizes="56px"
                      alt={p.name}
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-full border border-edge object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-2xl">{p.name}</p>
                    {p.unlockBoost && (
                      <p className="text-sm text-accent font-bold">{p.unlockBoost}</p>
                    )}
                  </div>
                </div>

                {/* Linked mech/weapon: clickable icon on the left, its bonus at right. */}
                {(linked || p.relationshipBonus) && (
                  <div className="mt-3 flex items-center gap-2 border-t border-edge pt-3">
                    {linked && (
                      <Link
                        to={linked.to}
                        title={linked.name}
                        className="shrink-0 transition hover:brightness-110"
                      >
                        {linked.iconUrl ? (
                          <img
                            src={imageSrc(linked.iconUrl)}
                            srcSet={srcSet(linked.iconUrl)}
                            sizes="40px"
                            alt={linked.name}
                            loading="lazy"
                            className="h-12 w-12 rounded-lg border border-edge object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-xs text-accent">
                            {linked.name.slice(0, 2)}
                          </span>
                        )}
                      </Link>
                    )}
                    {p.relationshipBonus && (
                      <p className="min-w-0 text-sm">{p.relationshipBonus}</p>
                    )}
                  </div>
                )}

                {/* Per-level bonuses (1-4): full-bleed bands (the -mx-4 cancels
                    the card padding) with the gem in a recessed left cell, but
                    the gem and text keep their own inner padding. */}
                {p.bonusPerLevel.length > 0 && (
                  <ul className="-mx-4 mt-3 space-y-2 text-sm">
                    {p.bonusPerLevel.map((bonus, i) => (
                      <li
                        key={i}
                        className="flex items-stretch border-y border-edge bg-surface-2 mb-0"
                      >
                        <span className="flex items-center border-r border-edge bg-bg px-4">
                          <Gem index={i} />
                        </span>
                        <span className="px-4 py-2 text-ink-dim font-semibold">{bonus}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
