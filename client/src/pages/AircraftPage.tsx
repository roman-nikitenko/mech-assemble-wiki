import { useState } from "react";
import { useAircraft } from "../api/client";
import type { MechRank } from "../api/types";
import { AircraftCard } from "../components/AircraftCard";
import { AircraftQualityTable } from "../components/AircraftQualityTable";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { Seo } from "../components/Seo";
import { STierIcon } from "../components/STierIcon";

/** Public aircraft list: image, tier, stats, description and the rank-up
    preview. No per-aircraft detail page — everything shows on the card. */
export function AircraftPage() {
  const { data, isPending, isError, refetch } = useAircraft();
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<MechRank | "">("");

  const query = search.trim().toLowerCase();
  const visible = (data ?? []).filter((a) => {
    const nameOk = !query || a.name.toLowerCase().includes(query);
    const tierOk = tier === "" || a.tier === tier;
    return nameOk && tierOk;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Aircraft — Mech Assemble Wiki"
        description="Every aircraft in Mech Assemble: Zombie Swarm — their tier, stats, and rank-up bonuses."
        path="/aircraft"
      />
      {/* The quality ladder applies to every aircraft, so it goes above the list. */}
      <AircraftQualityTable />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search aircraft..."
          className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm sm:w-64"
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tier">
          {(["Standard", "S"] as const).map((t) => {
            const active = tier === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                aria-label={`${t} tier`}
                title={`${t} tier`}
                onClick={() => setTier(active ? "" : t)}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-edge bg-surface text-ink-dim hover:text-ink"
                }`}
              >
                {t === "S" ? <STierIcon size={28} /> : t}
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
        <p className="mt-8 text-center text-ink-dim">No aircraft recorded yet.</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No aircraft match.</p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((a) => (
            <AircraftCard key={a.id} aircraft={a} />
          ))}
        </div>
      )}
    </main>
  );
}
