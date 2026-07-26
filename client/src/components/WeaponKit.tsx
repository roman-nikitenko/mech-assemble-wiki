import type { Helper, SkillNodeRow, WeaponSkinRow } from "../api/types";
import { imageSrc } from "../api/client";
import { SkillNodeBranch } from "./SkillNodeBranch";
import { HelperCard } from "./HelperCard";

/** The parts of a weapon this component renders. Both `Weapon` (mech tab) and
    `WeaponDetail` (detail page) structurally satisfy it, so the kit renders
    identically in both places. */
interface WeaponKitData {
  skillNodes: SkillNodeRow[];
  weaponSkins: WeaponSkinRow[];
  helpers: Helper[];
}

/** Skills + Skins + Weapon helpers, shared by the mech's Weapon tab and the
    standalone weapon detail page. Extracted verbatim from WeaponTab. */
export function WeaponKit({ weapon }: { weapon: WeaponKitData }) {
  return (
    <>
      {weapon.skillNodes.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Skills
          </h3>
          <SkillNodeBranch nodes={weapon.skillNodes} parentId={null} />
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
    </>
  );
}
