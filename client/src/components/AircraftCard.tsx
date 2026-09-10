import { imageSrc, srcSet, CARD_SIZES } from "../api/client";
import type { Aircraft, QualityTier } from "../api/types";
import { AIRCRAFT_RANK_TIERS, RankUpPreview } from "./RankUpPreview";
import { STierIcon } from "./STierIcon";
import aircraftBg from "../assets/aircraft_bg.webp";

const STATS = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "ATK" },
  { key: "def", label: "DEF" },
] as const;

export function AircraftCard({
  aircraft,
  quality,
}: {
  aircraft: Aircraft;
  /** The quality this aircraft is set to inside a build — rank-up rows above it
      are dimmed. Omitted on the public Aircraft page, where nothing is locked. */
  quality?: QualityTier;
}) {
  return (
    <div className="overflow-hidden border border-edge bg-surface relative">
      <div 
        className="flex aspect-1/1 items-center justify-center bg-surface-2 bg-no-repeat bg-cover bg-position-[center_top_-100px]"
        style={{ backgroundImage: `url(${aircraftBg})` }}
      >
        {aircraft.imageUrl ? (
          <img
            src={imageSrc(aircraft.imageUrl)}
            srcSet={srcSet(aircraft.imageUrl)}
            sizes={CARD_SIZES}
            alt={aircraft.name}
            loading="lazy"
            className="h-full w-full object-contain animate-drone-float"
          />
        ) : (
          <div className="h-full w-full" aria-hidden />
        )}
        <h3
          className="flex items-center justify-center gap-2 text-xl font-black absolute top-1"
        >
          {aircraft.tier === "S" && <STierIcon size={45} />}
          <span className="truncate">{aircraft.name}</span>
        </h3>
      </div>

      <div className="p-3">
        <div className=" grid grid-cols-3 gap-2">
          {STATS.map(({ key, label }) => {
            const value = aircraft[key];
            if (!value) return null;
            return (
              <div key={key} className="bg-surface-2 px-3 py-2 text-sm">
                <span className="block font-semibold text-ink-dim">{label}</span>
                <span className="font-black">{value}</span>
              </div>
            );
          })}
        </div>

        {aircraft.specialBonus && (
          <div className=" text-center text-sm text-accent">
            <span className="font-black text-xl">{aircraft.specialBonus}</span>
          </div>
        )}

        {aircraft.description && (
          <p className="mt-3 whitespace-pre-line text-sm text-ink-dim">{aircraft.description}</p>
        )}

        <div className="mt-3">
          <RankUpPreview
            steps={aircraft.rankUpPreview}
            tiers={AIRCRAFT_RANK_TIERS}
            quality={quality}
          />
        </div>
      </div>
    </div>
  );
}
