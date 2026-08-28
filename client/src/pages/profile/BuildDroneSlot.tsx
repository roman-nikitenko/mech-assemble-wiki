import { useState } from "react";
import { imageSrc } from "../../api/client";
import { DroneCard } from "../../components/DroneCard";
import type { Drone, DroneType } from "../../api/types";
import { QualityGem } from "../../components/QualityIcon";
import { Dropdown } from "../../components/Dropdown";
import { droneQualityBorder } from "../../lib/droneQualityBorder";
import { useLockBodyScroll } from "../../lib/useLockBodyScroll";
import { DRONE_QUALITIES, droneQualityName } from "../../profile/droneSlots";

export function BuildDroneSlot({
  index,
  typeName,
  droneType,
  drone,
  quality,
  onPick,
  onClear,
  onQualityChange,
  readOnly = false,
}: {
  index: number;
  typeName: string;
  droneType: DroneType | undefined;
  drone: Drone | undefined;
  quality: number;
  onPick?: () => void;
  onClear?: () => void;
  onQualityChange?: (quality: number) => void;
  readOnly?: boolean;
}) {
  const slotNo = index + 1;
  const [showInfo, setShowInfo] = useState(false);
  useLockBodyScroll(showInfo);
  const typeIcon = droneType?.iconUrl ? (
    <img
      src={imageSrc(droneType.iconUrl)}
      alt=""
      className="absolute bottom-1 left-1 h-8 w-8 object-contain"
    />
  ) : null;

  const frame = drone ? droneQualityBorder(quality) : undefined;
  const inner = (
    <>
      {frame && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[length:100%_100%] bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${frame})` }}
        />
      )}
      {drone?.iconUrl ? (
        <img
          src={imageSrc(drone.iconUrl)}
          alt=""
          className="relative h-full w-full object-contain p-3"
        />
      ) : drone ? (
        <span className="relative flex h-full w-full items-center justify-center text-2xl font-black text-white drop-shadow">
          {drone.name.charAt(0)}
        </span>
      ) : (
        <span className="flex h-full w-full items-center justify-center text-3xl text-ink-dim">+</span>
      )}
      {typeIcon}
    </>
  );

  const squareCls = frame
    ? "relative aspect-square w-full"
    : "relative aspect-square w-full bg-bg/40 backdrop-blur-sm " +
      (drone ? "border-2 border-accent/70" : "border-2 border-dashed border-edge");

  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex">
        {readOnly ? (
          <div className={squareCls} title={drone?.name ?? typeName}>
            {inner}
          </div>
        ) : (
          <button
            type="button"
            onClick={onPick}
            aria-label={
              drone
                ? `Change the drone in slot ${slotNo} (${drone.name})`
                : `Add a ${typeName} drone to slot ${slotNo}`
            }
            title={drone?.name ?? typeName}
            className={`${squareCls} cursor-pointer hover:border-accent`}
          >
            {inner}
          </button>
        )}
        {!readOnly && drone && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${drone.name} from slot ${slotNo}`}
            className="absolute -right-2 -top-2 h-6 w-6 cursor-pointer rounded-full border border-edge bg-surface text-xs text-ink-dim hover:border-fire hover:text-fire"
          >
            ✕
          </button>
        )}
        {readOnly && drone && (
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            aria-label={`More about ${drone.name}`}
            title={`More about ${drone.name}`}
            className="absolute -right-2 -top-2 h-6 w-6 cursor-pointer rounded-full border border-edge bg-surface text-xs font-black text-ink-dim hover:border-accent hover:text-accent"
          >
            i
          </button>
        )}
      </div>

      {showInfo && drone && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={drone.name}
          onClick={() => setShowInfo(false)}
        >
          <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              aria-label="Close"
              className="absolute -right-3 -top-3 z-10 h-8 w-8 cursor-pointer rounded-full border border-edge bg-surface text-sm text-ink-dim hover:border-fire hover:text-fire"
            >
              ✕
            </button>
            <div className="max-h-[85vh] overflow-y-auto">
              <DroneCard drone={drone} type={droneType} quality={quality} />
            </div>
          </div>
        </div>
      )}

      {!readOnly && (
        <Dropdown
          ariaLabel={`Drone slot ${slotNo} quality`}
          value={String(quality)}
          onChange={(v) => onQualityChange?.(Number(v))}
          options={DRONE_QUALITIES.map((n) => ({
            value: String(n),
            label: droneQualityName(n),
            icon: <QualityGem n={n} size={16} />,
          }))}
        />
      )}
    </div>
  );
}
