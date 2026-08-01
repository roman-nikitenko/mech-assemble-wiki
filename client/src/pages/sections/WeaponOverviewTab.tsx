import type { WeaponDetail } from "../../api/types";
import { StatBlock } from "../../components/StatBlock";
import { LinkedRow } from "../../components/LinkedRow";
import { RankUpPreview } from "../../components/RankUpPreview";

/** Weapon Overview: linked mech + pilot, base stats, and rank-up preview —
    mirroring the mech's Overview tab (mech/pilot here replace weapon/accessory). */
export function WeaponOverviewTab({ weapon }: { weapon: WeaponDetail }) {
  return (
    <div className="space-y-5">
      {(weapon.mech || weapon.pilot) && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Linked Mech
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {weapon.mech && (
              <LinkedRow
                to={`/mechs/${weapon.mech.slug ?? weapon.mech.id}`}
                iconUrl={weapon.mech.iconUrl}
                name={weapon.mech.name}
                bonus={weapon.mech.specialBonus}
              />
            )}
            {weapon.pilot && (
              // No pilot detail page exists yet, so this icon is not a link.
              <LinkedRow
                iconUrl={weapon.pilot.iconUrl}
                name={weapon.pilot.name}
                bonus={weapon.pilot.relationshipBonus}
              />
            )}
          </div>
        </section>
      )}
      {weapon.baseStats && Object.keys(weapon.baseStats).length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Base Stats
          </h2>
          <StatBlock stats={weapon.baseStats} />
        </section>
      )}
      <RankUpPreview steps={weapon.rankUpPreview} />
    </div>
  );
}
