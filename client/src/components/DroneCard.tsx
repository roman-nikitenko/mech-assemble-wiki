import { imageSrc } from "../api/client";
import type { Drone, DroneType } from "../api/types";
import { QualityGem } from "./QualityIcon";
import { STierIcon } from "./STierIcon";
import droneCardBg from "../assets/drone-card-bg.webp";

// The quality image shown beside each level-up bonus row, in order.
const DRONE_BONUS_GEMS = [0, 7, 8, 9];

const STATS = [
  { key: "inheritAttack", label: "Inherit Attack" },
  { key: "hp", label: "HP" },
  { key: "atk", label: "ATK" },
  { key: "def", label: "DEF" },
] as const;

export function DroneCard({ drone, type }: { drone: Drone; type: DroneType | undefined }) {
  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="bg-bottom bg-no-repeat bg-contain relative">
        <div
          className="absolute inset-0 bg-amber-500 z-0 bg-bottom bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${droneCardBg})` }}
        ></div>
        <div className="bg-gradient-to-r absolute w-full z-10 px-3 py-2 text-center">
          <h3 className="flex items-center justify-center gap-2 text-xl font-black ">
            {drone.tier === "S" && <STierIcon size={45} />}
            <span className="truncate">{drone.name}</span>
          </h3>
        </div>
        <div className="flex flex-col items-center bg-surface-2/60 px-3 pt-3 pb-2">
          {drone.iconUrl ? (
            <img
              src={imageSrc(drone.iconUrl)}
              alt={drone.name}
              loading="lazy"
              className="animate-drone-float h-full z-0 w-full object-contain"
            />
          ) : (
            <div className="h-44 w-full" aria-hidden />
          )}
          {type && (
            <div className="mt-1 flex absolute bottom-0 flex-col items-center">
              {type.iconUrl && (
                <img src={imageSrc(type.iconUrl)} alt="" className="h-10 w-10 object-contain" />
              )}
              <span className="font-black text-white [-webkit-text-stroke:0.3px_#000]">{type.name}</span>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {STATS.map(({ key, label }) => {
          const value = drone[key];
          if (!value) return null;
          return (
            <div key={key} className="flex items-center gap-2 bg-surface-2 px-3 py-2 text-sm">
              <span className="font-semibold text-ink-dim">{label}</span>
              <span className="ml-auto font-black">{value}</span>
            </div>
          );
        })}
      </div>

      {drone.levelUpBonuses.length > 0 && (
        <div className="space-y-2 px-3 pb-3">
          {drone.levelUpBonuses.map((bonus, i) => (
            <div key={i} className="flex items-center gap-3 bg-surface-2 px-3 py-2">
              <QualityGem n={DRONE_BONUS_GEMS[i % DRONE_BONUS_GEMS.length]} />
              <span className="text-sm font-semibold text-ink-dim">{bonus}</span>
            </div>
          ))}
        </div>
      )}

      {drone.tier === "S" && drone.previewVideoUrl && (
        <div className="px-3 pb-3">
          <video src={imageSrc(drone.previewVideoUrl)} controls className="w-full rounded-lg border border-edge" />
        </div>
      )}
    </div>
  );
}
