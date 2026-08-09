import type { Helper, SkillNodeRow, WeaponSkinRow } from "../api/types";
import { imageSrc } from "../api/client";
import { SkillNodeBranch } from "./SkillNodeBranch";
import { HelperCard } from "./HelperCard";
import { StarNumber } from "./StarNumber";

interface WeaponKitData {
  skillNodes: SkillNodeRow[];
  weaponSkins: WeaponSkinRow[];
  helpers: Helper[];
}

export function WeaponSkins({ skins }: { skins: WeaponSkinRow[] }) {
  if (skins.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
        Skins
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {skins.map((skin) => (
          <div key={skin.id} className="rounded-xl border border-edge bg-surface p-4">
            {skin.imageUrl && (
              <img
                src={imageSrc(skin.imageUrl)}
                alt={skin.name}
                className="mb-3 aspect-2/1 rounded-lg object-contain"
              />
            )}
            <p className="font-semibold">{skin.name}</p>
            {skin.bonuses.length > 0 && (
              <ul className="mt-2 space-y-1">
                {skin.bonuses.map((bonus, i) => (
                  <li key={i} className="flex items-center gap-2 text-white font-[600] text-sm">
                    <StarNumber n={i + 1} /> {bonus}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function WeaponHelpers({ helpers }: { helpers: Helper[] }) {
  if (helpers.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
        Weapon helpers
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {helpers.map((h) => (
          <HelperCard key={h.id} helper={h} />
        ))}
      </div>
    </section>
  );
}

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
      <WeaponSkins skins={weapon.weaponSkins} />
      <WeaponHelpers helpers={weapon.helpers} />
    </>
  );
}
