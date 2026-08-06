import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, srcSet, CARD_SIZES, useAccessories } from "../api/client";
import type { MechRank } from "../api/types";
import { FilterBar } from "../components/FilterBar";
import { RankBadge } from "../components/RankBadge";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { Seo } from "../components/Seo";
import cardBg from "../assets/acessery-card-bg.jpeg";

/** Public accessory list: base attributes for everyone, plus the exclusive
    effect when the accessory is bound to a specific mech. */
export function AccessoriesPage() {
  const { data, isPending, isError, refetch } = useAccessories();

  // Accessories carry a tier (Standard/S) but no type, so we reuse FilterBar
  // with an empty type catalog — only the tier chips + search box show.
  const [tiers, setTiers] = useState<MechRank[]>([]);
  const [search, setSearch] = useState("");

  const toggleTier = (t: MechRank) =>
    setTiers((list) => (list.includes(t) ? list.filter((v) => v !== t) : [...list, t]));

  const query = search.trim().toLowerCase();
  const visible = (data ?? []).filter((a) => {
    const tierOk = tiers.length === 0 || tiers.includes(a.tier);
    // Search matches the accessory name OR its linked mech's name.
    const searchOk =
      !query ||
      a.name.toLowerCase().includes(query) ||
      (a.mech?.name ?? "").toLowerCase().includes(query);
    return tierOk && searchOk;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Accessories — Mech Assemble Wiki"
        description="Every accessory in Mech Assemble: Zombie Swarm — attributes and the exclusive effects unlocked when bound to a mech."
        path="/accessories"
      />
      <FilterBar
        types={[]}
        selectedTypeIds={[]}
        selectedRanks={tiers}
        search={search}
        onToggleType={() => {}}
        onToggleRank={toggleTier}
        onSearchChange={setSearch}
        onClear={() => setTiers([])}
        rankGroupLabel="tier"
        searchPlaceholder="Search accessories or mech..."
      />
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No accessories recorded yet.</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No accessories match.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((a) => (
            <div key={a.id} className={`rounded-xl border border-edge p-4 `}>
              <div
                className="aspect-2/1 rounded-lg mb-2 flex items-center justify-center bg-no-repeat bg-center bg-cover"
                style={{ backgroundImage: `url(${cardBg})` }}
              >
                {a.imageUrl && (
                  <img
                    src={imageSrc(a.imageUrl)}
                    srcSet={srcSet(a.imageUrl)}
                    sizes={CARD_SIZES}
                    alt={a.name}
                    loading="lazy"
                    className="mb-2 h-24 object-cover"
                  />
                )}
              </div>
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
                <div className="mt-2 flex items-center gap-2">
                  {/* Linked-mech icon: clicking it opens the mech's detail page. */}
                  <Link
                    to={`/mechs/${a.mech.slug ?? a.mech.id}`}
                    title={a.mech.name}
                    className="shrink-0 transition hover:brightness-110"
                  >
                    {a.mech.iconUrl ? (
                      <img
                        src={imageSrc(a.mech.iconUrl)}
                        srcSet={srcSet(a.mech.iconUrl)}
                        sizes="40px"
                        alt={a.mech.name}
                        loading="lazy"
                        className="h-10 w-10 rounded-full border border-edge object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge text-xs text-accent">
                        {a.mech.name.slice(0, 2)}
                      </span>
                    )}
                  </Link>
                  <p className="min-w-0 text-sm">
                    {a.exclusiveEffect}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
