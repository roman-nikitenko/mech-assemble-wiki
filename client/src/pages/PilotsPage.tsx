import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { imageSrc, srcSet, usePilots } from "../api/client";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { Gem } from "../components/Gem";
import { Seo } from "../components/Seo";
const STATS = ["ATK", "DEF", "HP"] as const;

/** Public pilot list: portrait, boosts, and where the pilot serves
    (a mech's cockpit OR fronting a weapon — never both). */
export function PilotsPage() {
  const { data, isPending, isError, refetch } = usePilots();
  const location = useLocation();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<string[]>([]);

  const toggleStat = (s: string) =>
    setStats((list) => (list.includes(s) ? list.filter((v) => v !== s) : [...list, s]));

  useEffect(() => {
    const match = location.hash.match(/^#pilot-(.+)$/);
    // Wait until the pilots have rendered before trying to find the card.
    if (!match || !data) return;
    const id = match[1];
    if (!data.some((p) => p.id === id)) return;

    document.getElementById(`pilot-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    // Accent border draws the eye on arrival, then fades back to normal.
    const timer = setTimeout(() => setHighlightedId(null), 2000);
    return () => clearTimeout(timer);
  }, [location.hash, data]);

  const query = search.trim().toLowerCase();
  const visible = (data ?? []).filter((p) => {
    const nameOk = !query || p.name.toLowerCase().includes(query);
    const bonusText = [p.unlockBoost, p.relationshipBonus, ...p.bonusPerLevel]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const statOk = stats.length === 0 || stats.some((s) => bonusText.includes(s.toLowerCase()));
    return nameOk && statOk;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Pilots — Mech Assemble Wiki"
        description="All pilots in Mech Assemble: Zombie Swarm — their boosts, relationship bonuses, and the mech or weapon they serve."
        path="/pilots"
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pilots..."
          className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm sm:w-64"
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by stat">
          {STATS.map((stat) => {
            const active = stats.includes(stat);
            return (
              <button
                key={stat}
                type="button"
                aria-pressed={active}
                onClick={() => toggleStat(stat)}
                className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-1 text-sm font-semibold transition-colors ${
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-edge bg-surface text-ink-dim hover:text-ink"
                }`}
              >
                {stat}
              </button>
            );
          })}
        </div>
      </div>
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No pilots recorded yet.</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No pilots match.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {visible.map((p) => {
            const linked = p.mech
              ? { to: `/mechs/${p.mech.id}`, name: p.mech.name, iconUrl: p.mech.iconUrl }
              : p.weapon
                ? { to: `/weapons/${p.weapon.id}`, name: p.weapon.name, iconUrl: p.weapon.iconUrl }
                : null;

            return (
              <div
                key={p.id}
                id={`pilot-${p.id}`}
                className={`scroll-mt-20 rounded-xl border bg-surface p-4 pb-0 overflow-hidden transition-colors duration-700 ${
                  highlightedId === p.id ? "border-accent" : "border-edge"
                }`}
              >
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
