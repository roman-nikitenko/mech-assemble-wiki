import type { GameType } from "../api/types";
import { imageSrc } from "../api/client";

/** Neutral chip with the type's icon + name. Types are admin-managed catalog
    rows now, so there is no hard-coded per-type color anymore. Callers skip
    rendering when a mech/weapon has no type yet. */
export function TypeBadge({ type }: { type: GameType }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface-2 px-2.5 py-0.5 text-xs font-semibold">
      {type.iconUrl && (
        <img src={imageSrc(type.iconUrl)} alt="" className="h-4 w-4 rounded-full object-cover" />
      )}
      {type.name}
    </span>
  );
}
