import { LinkedRow } from "../../components/LinkedRow";
import { RankUpPreview } from "../../components/RankUpPreview";
import type { MechDetail } from "../../api/types";

export function OverviewTab({ mech }: { mech: MechDetail }) {
  return (
    <div className="space-y-5">
      {(mech.weapon || mech.accessory) && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Linked Weapon
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {mech.weapon && (
              <LinkedRow
                to={`/weapons/${mech.weapon.id}`}
                iconUrl={mech.weapon.iconUrl}
                name={mech.weapon.name}
                bonus={mech.weapon.description}
              />
            )}
            {mech.accessory && (
              // No accessory detail page exists yet, so this icon is not a link.
              <LinkedRow
                iconUrl={mech.accessory.iconUrl}
                name={mech.accessory.name}
                bonus={mech.accessory.exclusiveEffect}
              >
                
              </LinkedRow>
            )}
          </div>
        </section>
      )}
      {mech.traits.length > 0 && (
        <section>
          <h2 className="mb-2  text-sm font-bold uppercase tracking-wider text-ink-dim">
            Mech Traits
          </h2>
          <div className="grid max-w-[600px] grid-cols-2 gap-2">
            {mech.traits.map(({ id, trait }) => (
              <span
                key={id}
                className=" text-center border border-edge bg-surface px-3 py-1 text-sm font-semibold"
              >
                {trait.name}
              </span>
            ))}
          </div>
        </section>
      )}
      <RankUpPreview steps={mech.rankUpPreview} />
    </div>
  );
}
