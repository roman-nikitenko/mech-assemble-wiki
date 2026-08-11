import type { Skin } from "../api/types";
import { imageSrc } from "../api/client";
import { StarNumber } from "./StarNumber";
import skinBg from "../assets/mech-skin-bg.jpeg";

export function SkinCard({ skin }: { skin: Skin }) {
  return (
    <div className="rounded-xl overflow-hidden relative border border-edge bg-surface">
      <div style={{ background: `url(${skinBg})`, backgroundRepeat: "no-repeat", backgroundSize: "cover", backgroundPosition: "center"}}>
        {skin.imageUrl && (
          <img
            src={imageSrc(skin.imageUrl)}
            alt={`${skin.name} skin`}
            className="h-full max-h-[550px] w-full object-contain"
          />
        )}
      </div>
      <p className="absolute top-2 w-full text-center font-black text-2xl text-white [-webkit-text-stroke:1px_black]">{skin.name}</p>
      {skin.description && (
        <p className="mt-1 text-sm text-ink-dim">{skin.description}</p>
      )}
      {skin.stars.length > 0 && (
        <ul className="space-y-1 p-4">
          {skin.stars.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <StarNumber n={s.star} />
              <span className="text-ink-dim font-semibold">{s.perk}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
