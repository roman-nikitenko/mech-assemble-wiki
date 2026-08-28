import { useState } from "react";
import { imageSrc } from "../../api/client";
import type { Drone, DroneSelection, DroneType } from "../../api/types";
import {
  DEFAULT_DRONE_QUALITY,
  DRONE_SLOTS,
  droneSlotSelection,
  pickedDroneIds,
} from "../../profile/droneSlots";
import { BuildDroneSlot } from "./BuildDroneSlot";
import { useLockBodyScroll } from "../../lib/useLockBodyScroll";

/** The build's Drones section: 6 type-bound squares (2 Battle, 2 Bombardment,
    2 Support) plus the picker modal. A drone equipped in one square is hidden
    from every picker, so it can never be equipped twice. */
export function BuildDronesSection({
  drones,
  droneTypes,
  selections,
  onChange,
  readOnly = false,
}: {
  drones: Drone[];
  droneTypes: DroneType[];
  selections: Record<string, DroneSelection>;
  onChange?: (next: Record<string, DroneSelection>) => void;
  readOnly?: boolean;
}) {
  // Which square's picker is open (null = closed).
  const [picking, setPicking] = useState<number | null>(null);
  useLockBodyScroll(picking !== null);

  const typeByName = (name: string) => droneTypes.find((t) => t.name === name);
  const droneById = (id: string | null) =>
    id === null ? undefined : drones.find((d) => d.id === id);

  function setSlot(index: number, patch: Partial<DroneSelection>) {
    const current = droneSlotSelection(selections, index);
    onChange?.({ ...selections, [String(index)]: { ...current, ...patch } });
  }

  const pickingType = picking === null ? undefined : typeByName(DRONE_SLOTS[picking]);
  // Drones equipped in OTHER squares — the open square's own drone stays in the
  // list so re-opening it doesn't hide what's already there.
  const takenElsewhere =
    picking === null
      ? []
      : pickedDroneIds(selections).filter(
          (id) => id !== droneSlotSelection(selections, picking).droneId
        );
  // Only this slot's type. A drone with no type set therefore appears in no
  // picker at all.
  const pickable =
    picking === null
      ? []
      : drones.filter(
          (d) =>
            d.droneTypeId !== null &&
            d.droneTypeId === pickingType?.id &&
            !takenElsewhere.includes(d.id)
        );

  return (
    <div>
      <h2 className="mb-2 text-lg font-black tracking-tight">Drones</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {DRONE_SLOTS.map((typeName, i) => {
          const sel = droneSlotSelection(selections, i);
          return (
            <BuildDroneSlot
              key={i}
              index={i}
              typeName={typeName}
              droneType={typeByName(typeName)}
              drone={droneById(sel.droneId)}
              quality={sel.quality}
              readOnly={readOnly}
              onPick={() => setPicking(i)}
              onClear={() => setSlot(i, { droneId: null, quality: DEFAULT_DRONE_QUALITY })}
              onQualityChange={(q) => setSlot(i, { quality: q })}
            />
          );
        })}
      </div>

      {picking !== null && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-bg/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Choose a ${DRONE_SLOTS[picking]} drone`}
        >
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-edge bg-surface p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-bold">Choose a {DRONE_SLOTS[picking]} drone</h3>
              <button
                type="button"
                onClick={() => setPicking(null)}
                className="min-h-11 cursor-pointer rounded-lg border border-edge px-4 text-sm"
              >
                Cancel
              </button>
            </div>
            {pickable.length === 0 ? (
              <p className="text-sm text-ink-dim">No {DRONE_SLOTS[picking]} drones available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {pickable.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-label={d.name}
                    onClick={() => {
                      setSlot(picking, { droneId: d.id });
                      setPicking(null);
                    }}
                    className="cursor-pointer rounded-xl border border-edge bg-surface-2 p-2 hover:border-accent/60"
                  >
                    {d.iconUrl ? (
                      <img
                        src={imageSrc(d.iconUrl)}
                        alt=""
                        loading="lazy"
                        className="mx-auto h-20 w-full object-contain"
                      />
                    ) : (
                      <span className="flex h-20 items-center justify-center text-2xl font-black text-ink-dim">
                        {d.name.charAt(0)}
                      </span>
                    )}
                    <p className="mt-1 truncate text-center text-sm font-semibold">{d.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
