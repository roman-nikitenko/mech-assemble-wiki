import type { Weapon } from "../../api/types";
import { StatBlock } from "../../components/StatBlock";
import { UpgradeTree } from "../../components/UpgradeTree";
import { SkinCard } from "../../components/SkinCard";
import { HelperCard } from "../../components/HelperCard";

export function WeaponTab({ weapon }: { weapon: Weapon }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-accent/30 bg-surface/50 p-4">
        <h2 className="text-lg font-bold text-accent">{weapon.name}</h2>
        {weapon.description && (
          <p className="mt-1 text-sm text-ink-dim">{weapon.description}</p>
        )}
        <div className="mt-3">
          <StatBlock stats={weapon.baseStats} />
        </div>
      </section>
      {weapon.upgrades.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Upgrade tree
          </h3>
          <UpgradeTree roots={weapon.upgrades} />
        </section>
      )}
      {(weapon.skins.length > 0 || weapon.helpers.length > 0) && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Weapon skins &amp; helpers
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {weapon.skins.map((s) => (
              <SkinCard key={s.id} skin={s} />
            ))}
            {weapon.helpers.map((h) => (
              <HelperCard key={h.id} helper={h} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
