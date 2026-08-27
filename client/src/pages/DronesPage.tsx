import { useState } from "react";
import { imageSrc, useDrones, useDroneTypes } from "../api/client";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { DroneCard } from "../components/DroneCard";
import { Seo } from "../components/Seo";

/** Public drone list: icon, tier, type, stats, level-up bonuses, and (S-tier)
    a preview clip. No per-drone detail page — everything shows on the card. */
export function DronesPage() {
  const { data, isPending, isError, refetch } = useDrones();
  const droneTypes = useDroneTypes();
  const [search, setSearch] = useState("");
  const [typeIds, setTypeIds] = useState<string[]>([]);

  const toggleType = (id: string) =>
    setTypeIds((list) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id]));

  const typeById = new Map((droneTypes.data ?? []).map((t) => [t.id, t]));

  const query = search.trim().toLowerCase();
  const visible = (data ?? []).filter((d) => {
    const nameOk = !query || d.name.toLowerCase().includes(query);
    const typeOk = typeIds.length === 0 || (d.droneTypeId !== null && typeIds.includes(d.droneTypeId));
    return nameOk && typeOk;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Drones — Mech Assemble Wiki"
        description="All drones in Mech Assemble: Zombie Swarm — their type, tier, stats, and level-up bonuses."
        path="/drones"
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drones..."
          className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm sm:w-64"
        />
        {(droneTypes.data ?? []).length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by drone type">
            {(droneTypes.data ?? []).map((t) => {
              const active = typeIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  aria-label={t.name}
                  title={t.name}
                  onClick={() => toggleType(t.id)}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    active
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-edge bg-surface text-ink-dim hover:text-ink"
                  }`}
                >
                  {t.iconUrl ? (
                    <img src={imageSrc(t.iconUrl)} alt="" className="h-6 w-6 rounded object-contain" />
                  ) : (
                    t.name
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isPending ? (
        <LoadingSkeleton variant="cards" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No drones recorded yet.</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No drones match.</p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((d) => (
            <DroneCard
              key={d.id}
              drone={d}
              type={d.droneTypeId ? typeById.get(d.droneTypeId) : undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
}
