import type { Helper, Skin } from "../../api/types";
import { SkinCard } from "../../components/SkinCard";
import { HelperCard } from "../../components/HelperCard";

/** Mech-owned skins and helpers (weapon-owned ones live on the Weapon tab). */
export function SkinsHelpersTab({ skins, helpers }: { skins: Skin[]; helpers: Helper[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {skins.map((s) => (
        <SkinCard key={s.id} skin={s} />
      ))}
      {helpers.map((h) => (
        <HelperCard key={h.id} helper={h} />
      ))}
    </div>
  );
}
