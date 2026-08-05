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

export function WeaponsPage() {
  const { data, isPending, isError, refetch } = useWeapons();
  const types = useTypes();
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
        <div className="mt-4 grid  gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {visible.map((w) => (
            <Link
              key={w.id}
              to={`/weapons/${w.slug ?? w.id}`}
              className="block rounded-xl relative overflow-hidden border border-edge bg-surface transition hover:border-accent/60 hover:bg-surface-2"
            >
              {w.imageUrl ? (
                <img
                  src={imageSrc(w.imageUrl)}
                  srcSet={srcSet(w.imageUrl)}
                  sizes={CARD_SIZES}
                  alt={w.name}
                  loading="lazy"
                  className="h-62 w-full rounded-lg object-cover"
                />
              ) : (
                <div
                  className="mb-3 flex h-32 w-full items-center justify-center rounded-lg bg-surface-2 text-3xl"
                  aria-hidden
                >
                  ⚔️
                </div>
              )}
              <div className="flex items-center absolute min-w-full bottom-0 left-1/2 -translate-x-1/2 z-10 justify-center py-2 gap-2 backdrop-blur-sm bg-black/20">
                {w.tier !== "Standard" && <RankBadge rank={w.tier} />}
                <h2 className="font-bold">{w.name}</h2>
                <div className="flex items-center gap-2">
                  {w.type && <TypeBadge type={w.type} />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
