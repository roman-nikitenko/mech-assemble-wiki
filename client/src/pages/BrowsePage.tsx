import { useState } from "react";
import { useMechs, useTypes } from "../api/client";
import type { MechRank } from "../api/types";
import { FilterBar } from "../components/FilterBar";
import { MechCard } from "../components/MechCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { Seo } from "../components/Seo";

export function BrowsePage() {
  const [typeIds, setTypeIds] = useState<string[]>([]);
  const [ranks, setRanks] = useState<MechRank[]>([]);
  const [search, setSearch] = useState("");

  // All filtering is now client-side (multi-select type/rank + search): the mech
  // list is tiny, so we fetch it once and filter in the browser. This keeps the
  // "any of these types AND any of these ranks" logic simple and instant.
  const { data, isPending, isError, refetch } = useMechs({});
  const types = useTypes();

  // Toggle helpers: click a chip to add/remove it from its group's selection.
  const toggle = <T,>(value: T, list: T[], set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const query = search.trim().toLowerCase();
  const visible = (data ?? []).filter((m) => {
    // OR within each group, AND across groups; empty group = no filter.
    const typeOk = typeIds.length === 0 || (m.type != null && typeIds.includes(m.type.id));
    const rankOk = ranks.length === 0 || ranks.includes(m.rank);
    const searchOk =
      !query ||
      m.name.toLowerCase().includes(query) ||
      (m.epithet ?? "").toLowerCase().includes(query);
    return typeOk && rankOk && searchOk;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Mech Assemble Wiki — Mech Assemble: Zombie Swarm database"
        path="/"
      />
      {/* Title + Admin link live in PublicLayout now. */}
      <FilterBar
        types={types.data ?? []}
        selectedTypeIds={typeIds}
        selectedRanks={ranks}
        search={search}
        onToggleType={(id) => toggle(id, typeIds, setTypeIds)}
        onToggleRank={(r) => toggle(r, ranks, setRanks)}
        onSearchChange={setSearch}
        onClear={() => {
          setTypeIds([]);
          setRanks([]);
        }}
      />
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No mechs match.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((m, i) => (
            <MechCard key={m.id} mech={m} priority={i === 0} />
          ))}
        </div>
      )}
    </main>
  );
}
