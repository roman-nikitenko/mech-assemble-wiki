import type { Aircraft, AircraftAttributeGroup, AircraftSelection } from "../../api/types";
import {
  AIRCRAFT_SLOTS,
  aircraftSelection,
  pickedAircraftIds,
} from "../../profile/aircraftResetSlots";
import { BuildAircraftSlot } from "./BuildAircraftSlot";

/** The build's Aircraft section: two aircraft, each with its own quality and
    its own 5-roll Reset Effect panel. An aircraft equipped in one slot is
    hidden from the other's picker, so it can't be equipped twice. */
export function BuildAircraftSection({
  aircraft,
  attributeGroups,
  selections,
  onChange,
  readOnly = false,
}: {
  aircraft: Aircraft[];
  attributeGroups: AircraftAttributeGroup[];
  selections: Record<string, AircraftSelection>;
  onChange?: (next: Record<string, AircraftSelection>) => void;
  readOnly?: boolean;
}) {
  function setSlot(index: number, patch: Partial<AircraftSelection>) {
    const current = aircraftSelection(selections, index);
    onChange?.({ ...selections, [String(index)]: { ...current, ...patch } });
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-black tracking-tight">Aircraft</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {AIRCRAFT_SLOTS.map((i) => {
          const selection = aircraftSelection(selections, i);
          // Equipped in the OTHER slot — this slot's own pick stays listed so
          // re-opening its picker doesn't hide what's already there.
          const takenElsewhere = pickedAircraftIds(selections).filter(
            (id) => id !== selection.aircraftId
          );
          return (
            <BuildAircraftSlot
              key={i}
              index={i}
              selection={selection}
              aircraft={aircraft}
              pickable={aircraft.filter((a) => !takenElsewhere.includes(a.id))}
              attributeGroups={attributeGroups}
              readOnly={readOnly}
              onChange={(patch) => setSlot(i, patch)}
            />
          );
        })}
      </div>
    </div>
  );
}
