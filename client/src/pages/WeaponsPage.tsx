import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, srcSet, CARD_SIZES, useTypes, useWeapons } from "../api/client";
import type { MechRank } from "../api/types";
import { FilterBar } from "../components/FilterBar";
import { RankBadge } from "../components/RankBadge";
import { TypeBadge } from "../components/TypeBadge";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { Seo } from "../components/Seo";

/** Public weapon list. Each card links to the weapon's detail page
    (/weapons/:id), which shows its full kit. */
export function WeaponsPage() {
  const { data, isPending, isError, refetch } = useWeapons();
  const types = useTypes();

  // Same multi-select filtering as the mechs page — weapons carry a type and a
  // tier (Standard/S). All client-side: the weapon list is small.
  const [typeIds, setTypeIds] = useState<string[]>([]);
  const [tiers, setTiers] = useState<MechRank[]>([]);
  const [search, setSearch] = useState("");

  const toggle = <T,>(value: T, list: T[], set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const query = search.trim().toLowerCase();
  const visible = (data ?? []).filter((w) => {
    const typeOk = typeIds.length === 0 || (w.type != null && typeIds.includes(w.type.id));
    const tierOk = tiers.length === 0 || tiers.includes(w.tier);
    const searchOk =
      !query ||
      w.name.toLowerCase().includes(query) ||
      (w.description ?? "").toLowerCase().includes(query);
    return typeOk && tierOk && searchOk;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Weapons — Mech Assemble Wiki"
        description="Browse every weapon in Mech Assemble: Zombie Swarm — tiers, stats, skill trees, skins, and the mechs they belong to."
        path="/weapons"
      />
      <FilterBar
        types={types.data ?? []}
        selectedTypeIds={typeIds}
        selectedRanks={tiers}
        search={search}
        onToggleType={(id) => toggle(id, typeIds, setTypeIds)}
        onToggleRank={(t) => toggle(t, tiers, setTiers)}
        onSearchChange={setSearch}
        onClear={() => {
          setTypeIds([]);
          setTiers([]);
        }}
        rankGroupLabel="tier"
        searchPlaceholder="Search weapons..."
      />
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No weapons recorded yet.</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No weapons match.</p>
      ) : (
        <div className="mt-4 grid  gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((w) => (
            <Link
              key={w.id}
              to={`/weapons/${w.slug ?? w.id}`}
              className="block rounded-xl border border-edge bg-surface p-4 transition-colors hover:border-accent"
            >
              {w.imageUrl && (
                <img
                  src={imageSrc(w.imageUrl)}
                  srcSet={srcSet(w.imageUrl)}
                  sizes={CARD_SIZES}
                  alt={w.name}
                  loading="lazy"
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
                  <span className="text-xs text-ink-dim">{w.mech.name}&rsquo;s weapon</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
