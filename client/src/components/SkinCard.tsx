import type { Skin } from "../api/types";
import { imageSrc } from "../api/client";

/** Mech-owned skin card (Skins & Helpers tab). Weapon skins moved to their
    own table/render in Cycle G. */
export function SkinCard({ skin }: { skin: Skin }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      {skin.imageUrl && (
        <img
          src={imageSrc(skin.imageUrl)}
          alt={`${skin.name} skin`}
          className="mb-2 h-32 w-full rounded-lg border border-edge object-cover"
        />
      )}
      <p className="font-semibold">{skin.name}</p>
      {skin.description && (
        <p className="mt-1 text-sm text-ink-dim">{skin.description}</p>
      )}
      {skin.stars.length > 0 && (
        <ul className="mt-2 space-y-1">
          {skin.stars.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <span className="text-accent">{"★".repeat(s.star)}</span>
              <span className="text-ink-dim">{s.perk}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
