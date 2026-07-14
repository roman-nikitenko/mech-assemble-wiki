import type { Weapon } from "../../api/types";
import { imageSrc } from "../../api/client";
import { StatBlock } from "../../components/StatBlock";
import { UpgradeTree } from "../../components/UpgradeTree";
import { RankBadge } from "../../components/RankBadge";
import { HelperCard } from "../../components/HelperCard";

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
      {weapon.upgrades.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Upgrade tree
          </h3>
          <UpgradeTree roots={weapon.upgrades} />
        </section>
      )}
      {weapon.weaponSkins.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Skins
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {weapon.weaponSkins.map((skin) => (
              <div key={skin.id} className="rounded-xl border border-edge bg-surface p-4">
                {skin.imageUrl && (
                  <img
                    src={imageSrc(skin.imageUrl)}
                    alt={skin.name}
                    className="mb-3 h-28 w-full rounded-lg object-cover"
                  />
                )}
                <p className="font-semibold">{skin.name}</p>
                {skin.bonuses.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {skin.bonuses.map((bonus, i) => (
                      <li key={i} className="text-sm text-ink-dim">
                        <span className="text-accent">{"★".repeat(i + 1)}</span> {bonus}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {weapon.helpers.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Weapon helpers
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {weapon.helpers.map((h) => (
              <HelperCard key={h.id} helper={h} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
