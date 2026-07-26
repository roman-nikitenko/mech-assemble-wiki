import type { Weapon } from "../../api/types";
import { StatBlock } from "../../components/StatBlock";
import { RankBadge } from "../../components/RankBadge";
import { WeaponKit } from "../../components/WeaponKit";

export function WeaponTab({ weapon }: { weapon: Weapon }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-accent/30 bg-surface/50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-accent">{weapon.name}</h2>
          <RankBadge rank={weapon.tier} />
        </div>
        {weapon.description && (
          <p className="mt-1 text-sm text-ink-dim">{weapon.description}</p>
        )}
        <div className="mt-3">
          <StatBlock stats={weapon.baseStats} />
        </div>
      </section>
      <WeaponKit weapon={weapon} />
    </div>
  );
}
