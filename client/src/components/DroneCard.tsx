import { useState } from "react";
import { imageSrc } from "../api/client";
import { useLockBodyScroll } from "../lib/useLockBodyScroll";
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

export function DroneCard({
  drone,
  type,
  quality,
}: {
  drone: Drone;
  type: DroneType | undefined;
  /** The equipped quality gem (0-9) when shown inside a build. Level-up
      bonuses above it are dimmed. Omitted on the Drones browse page, where
      no quality is chosen and every bonus reads at full strength. */
  quality?: number;
}) {
  const [showVideo, setShowVideo] = useState(false);
  useLockBodyScroll(showVideo);

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="bg-bottom bg-no-repeat bg-contain relative">
        {drone.previewVideoUrl && (
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            aria-label="Play preview video"
            title="Play preview video"
            className="z-10 border w-10 h-10 absolute right-3 bottom-3 cursor-pointer rounded-lg border-edge bg-bg/60 text-lg text-white backdrop-blur-sm hover:border-accent hover:text-accent"
          >
            ▶
          </button>
        )}
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
          {drone.levelUpBonuses.map((bonus, i) => {
            const gem = DRONE_BONUS_GEMS[i % DRONE_BONUS_GEMS.length];
            // In a build, a bonus above the equipped quality isn't active yet,
            // so it's dimmed. On the browse page no quality is given and every
            // row shows at full strength.
            const locked = quality !== undefined && gem > quality;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 bg-surface-2 px-3 py-2 ${locked ? "opacity-40" : ""}`}
              >
                <QualityGem n={gem} />
                <span className="text-sm font-semibold text-ink-dim">{bonus}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* The <video> is mounted ONLY while the modal is open. Rendering it in
          the card would make every card on the Drones page start fetching its
          preview on load, which is the slow-page problem this replaces. */}
      {showVideo && drone.previewVideoUrl && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${drone.name} preview`}
          onClick={() => setShowVideo(false)}
        >
          {/* Half of the previous max-w-2xl (42rem) — the preview is a short
              clip, not something you sit and watch full-width. */}
          <div className="relative w-full max-w-[21rem]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowVideo(false)}
              aria-label="Close"
              className="absolute -right-3 -top-3 z-10 h-8 w-8 cursor-pointer rounded-full border border-edge bg-surface text-sm text-ink-dim hover:border-fire hover:text-fire"
            >
              ✕
            </button>
            {/* Loops while open; closing UNMOUNTS this element, which is what
                stops playback — no manual pause needed. */}
            <video
              src={imageSrc(drone.previewVideoUrl)}
              controls
              autoPlay
              loop
              // w-auto + both maxes, so the browser scales on the video's own
              // aspect ratio (as it does for an <img>) and a tall portrait clip
              // is capped by height instead of running off a short phone
              // screen. w-full here would clamp the height and letterbox.
              className="mx-auto max-h-[80vh] w-auto max-w-full rounded-lg border border-edge"
            />
          </div>
        </div>
      )}
    </div>
  );
}
