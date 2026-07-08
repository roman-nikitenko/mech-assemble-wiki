import type { Skin } from "../api/types";

/** Used by both the Weapon tab (weapon-owned skins) and the
    Skins & Helpers tab (mech-owned skins). */
export function SkinCard({ skin }: { skin: Skin }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
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
