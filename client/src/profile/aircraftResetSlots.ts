import type {
  AircraftAttribute,
  AircraftAttributeGroup,
  AircraftAttributeUnit,
  AircraftResetSlot,
  AircraftSelection,
  QualityTier,
} from "../api/types";
import type { AircraftGrade } from "../lib/aircraftGrade";
import { AIRCRAFT_RANK_TIERS } from "../components/RankUpPreview";

// The Reset Effect panel is 5 identical slots. Unlike DRONE_SLOTS the layout
// carries no per-slot label, so this is just the indices — and as with drones,
// THE INDEX IS THE STORAGE KEY.
export const AIRCRAFT_RESET_SLOTS = [0, 1, 2, 3, 4] as const;

export const DEFAULT_AIRCRAFT_GRADE: AircraftGrade = "G";

// A build carries TWO aircraft; the index is the storage key here too.
export const AIRCRAFT_SLOTS = [0, 1] as const;

// Aircraft use the colour ladder's top five (Orange→Mythic) — the same subset
// the aircraft cards' rank-up rows use, NOT the Q1-Q13 quality table and not
// the full Blue→Mythic run.
export const AIRCRAFT_QUALITIES: QualityTier[] = AIRCRAFT_RANK_TIERS;
export const DEFAULT_AIRCRAFT_QUALITY: QualityTier = AIRCRAFT_QUALITIES[0];

/** Read one aircraft slot, defaulting the shape so callers never null-check. */
export function aircraftSelection(
  selections: Record<string, AircraftSelection>,
  index: number
): AircraftSelection {
  const sel = selections[String(index)];
  return {
    aircraftId: sel?.aircraftId ?? null,
    quality: sel?.quality ?? DEFAULT_AIRCRAFT_QUALITY,
    resetSlots: sel?.resetSlots ?? {},
  };
}

/** Aircraft equipped in ANY slot — the picker hides these so the same aircraft
    can't be equipped twice. */
export function pickedAircraftIds(
  selections: Record<string, AircraftSelection>
): string[] {
  return AIRCRAFT_SLOTS.map((i) => aircraftSelection(selections, i).aircraftId).filter(
    (id): id is string => id !== null
  );
}

/** Read one slot's roll, defaulting the shape so callers never null-check. */
export function aircraftResetSlot(
  slots: Record<string, AircraftResetSlot>,
  index: number
): AircraftResetSlot {
  const slot = slots[String(index)];
  return {
    attributeId: slot?.attributeId ?? null,
    grade: slot?.grade ?? DEFAULT_AIRCRAFT_GRADE,
  };
}

/** Attribute ids used in ANY slot — the picker hides these so one attribute
    can't occupy two of the five rolls. */
export function pickedAttributeIds(slots: Record<string, AircraftResetSlot>): string[] {
  return AIRCRAFT_RESET_SLOTS.map((i) => aircraftResetSlot(slots, i).attributeId).filter(
    (id): id is string => id !== null
  );
}

/** The group an attribute belongs to — it carries the unit and the roll caps. */
export function attributeGroup(
  groups: AircraftAttributeGroup[],
  attributeId: string | null
): AircraftAttributeGroup | undefined {
  if (attributeId === null) return undefined;
  return groups.find((g) => g.attributes.some((a) => a.id === attributeId));
}

/** Every attribute across every group, flattened for a picker list. */
export function allAttributes(groups: AircraftAttributeGroup[]): AircraftAttribute[] {
  return groups.flatMap((g) => g.attributes);
}

export interface ResetRange {
  min: number;
  max: number;
  /** False when the band is a guess between two known rungs — the UI marks
      those so an unpublished number never reads as fact. */
  exact: boolean;
}

/** The value band a grade implies for an attribute.

    A grade's UPPER bound is the cap at its quality rung, and its LOWER bound is
    the cap at the rung below. The game publishes caps for three rungs only —
    Q1 (G), Q8 (S) and Q13 (SS) — so only two bands can be stated exactly:

      G                 [0, q1Max]    exact: nothing sits below Q1
      F E D C B A S     [q1Max, q8Max]  wide: Q2-Q7 caps are unpublished, and
                                        even S (Q8) has an exact upper bound but
                                        an unknown lower one
      SS                [q8Max, q13Max] exact: its lower bound IS Q8's cap

    This is the single place to change if real per-rung caps ever arrive — no
    storage or API change would be needed to sharpen every band. */
export function resetRange(
  grade: AircraftGrade,
  group: AircraftAttributeGroup | undefined
): ResetRange | undefined {
  if (!group) return undefined;
  if (grade === "G") return { min: 0, max: group.q1Max, exact: true };
  if (grade === "SS") return { min: group.q8Max, max: group.q13Max, exact: true };
  return { min: group.q1Max, max: group.q8Max, exact: false };
}

// "en-US" explicitly, not the visitor's locale: the game writes these numbers
// with comma separators, and a German browser would otherwise show "1.000".
function num(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** "80 – 100%" for a Percent group, "15,000 – 20,000" for a Flat one. */
export function formatResetRange(range: ResetRange, unit: AircraftAttributeUnit): string {
  const suffix = unit === "Percent" ? "%" : "";
  return `${num(range.min)} – ${num(range.max)}${suffix}`;
}
