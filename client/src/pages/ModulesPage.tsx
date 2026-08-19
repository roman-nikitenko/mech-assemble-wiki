import { useState } from "react";
import { useModuleQualities, useModules, useTypes } from "../api/client";
import type { QualityTier } from "../api/types";
import { QUALITY_TIERS } from "../api/types";
import { Dropdown } from "../components/Dropdown";
import { QualityIcon } from "../components/QualityIcon";
import { ModuleCard } from "../components/ModuleCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";

export function ModulesPage() {
  const modules = useModules();
  const qualities = useModuleQualities();
  const types = useTypes();
  const [tier, setTier] = useState<QualityTier>("Mythic");

  const quality = qualities.data?.find((q) => q.name === tier) ?? null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Attack Module</h1>
        <div className="w-44">
          <Dropdown
            ariaLabel="Quality"
            value={tier}
            onChange={(v) => setTier(v as QualityTier)}
            options={QUALITY_TIERS.map((t) => ({
              value: t,
              label: t,
              icon: <QualityIcon tier={t} size={16} />,
            }))}
          />
        </div>
      </div>

      {modules.isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : modules.isError ? (
        <ErrorPanel onRetry={() => modules.refetch()} />
      ) : (modules.data ?? []).length === 0 ? (
        <p className="mt-6 text-ink-dim">No modules yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.data!.map((m) => (
            <ModuleCard key={m.id} module={m} tier={tier} quality={quality} types={types.data ?? []} />
          ))}
        </div>
      )}
    </main>
  );
}
