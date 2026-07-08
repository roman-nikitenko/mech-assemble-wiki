import { useState } from "react";
import { useMechs } from "../api/client";
import type { MechRank, MechType } from "../api/types";
import { FilterBar } from "../components/FilterBar";
import { MechCard } from "../components/MechCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";

export function BrowsePage() {
  const [type, setType] = useState<MechType | "">("");
  const [rank, setRank] = useState<MechRank | "">("");
  const [search, setSearch] = useState("");

  // type/rank go to the API (it validates and filters);
  // search stays client-side — the list is already loaded and tiny.
  const { data, isPending, isError, refetch } = useMechs({
    type: type || undefined,
    rank: rank || undefined,
  });

  const query = search.trim().toLowerCase();
  const visible = (data ?? []).filter(
    (m) =>
      !query ||
      m.name.toLowerCase().includes(query) ||
      (m.epithet ?? "").toLowerCase().includes(query)
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-black tracking-tight">
        Mech <span className="text-accent">Assemble</span> Wiki
      </h1>
      <FilterBar
        type={type}
        rank={rank}
        search={search}
        onTypeChange={setType}
        onRankChange={setRank}
        onSearchChange={setSearch}
      />
      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No mechs match.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((m) => (
            <MechCard key={m.id} mech={m} />
          ))}
        </div>
      )}
    </main>
  );
}
