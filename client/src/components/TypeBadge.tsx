import type { GameType } from "../api/types";
import { imageSrc, srcSet } from "../api/client";

/** Neutral chip with the type's icon + name. Types are admin-managed catalog
    rows now, so there is no hard-coded per-type color anymore. Callers skip
    rendering when a mech/weapon has no type yet. */
export function TypeBadge({ type }: { type: GameType }) {
  return (
    <span className="inline-flex">
      {type.iconUrl && (
        <img
          src={imageSrc(type.iconUrl)}
          srcSet={srcSet(type.iconUrl)}
          sizes="24px"
          alt=""
          className="h-5 w-5 rounded-full object-cover"
        />
      )}
      {/* {type.name} */}
    </span>
  );
}
