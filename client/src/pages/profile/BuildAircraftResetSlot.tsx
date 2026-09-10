import type { AircraftAttribute, AircraftAttributeGroup, AircraftResetSlot } from "../../api/types";
import { AIRCRAFT_GRADES, type AircraftGrade } from "../../lib/aircraftGrade";
import { AircraftGradeIcon } from "../../components/AircraftGradeIcon";
import { Dropdown } from "../../components/Dropdown";
import { attributeGroup, formatResetRange, resetRange } from "../../profile/aircraftResetSlots";

/** One Reset Effect row: a grade badge, the attribute, and the value band the
    grade implies. The player never types a number — the band comes from the
    catalog's caps, so a build can't claim a roll the game can't produce. */
export function BuildAircraftResetSlot({
  index,
  slot,
  attributes,
  groups,
  onChange,
  onClear,
  readOnly = false,
}: {
  index: number;
  slot: AircraftResetSlot;
  /** Already filtered by the parent so an attribute can't be picked twice. */
  attributes: AircraftAttribute[];
  groups: AircraftAttributeGroup[];
  onChange?: (patch: Partial<AircraftResetSlot>) => void;
  onClear?: () => void;
  readOnly?: boolean;
}) {
  const slotNo = index + 1;
  const group = attributeGroup(groups, slot.attributeId);
  const range = resetRange(slot.grade, group);
  const attribute = attributes.find((a) => a.id === slot.attributeId);
  const badge = (
    <span className="flex shrink-0 items-center gap-1">
      <AircraftGradeIcon grade={slot.grade} size={28} />
    </span>
  );

  if (readOnly) {
    if (!attribute) return null;
    return (
      <li className="flex items-center gap-2 border border-edge bg-surface-2 px-3 py-2 text-sm">
        {badge}
        <span className="font-semibold">{attribute.name}</span>
        {range && group && (
          <span
            className="ml-auto font-black text-accent"
            title={range.exact ? undefined : "Approximate — the game doesn't publish caps for this grade"}
          >
            {range.exact ? "" : "~"}
            {formatResetRange(range, group.unit)}
          </span>
        )}
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-edge bg-surface-2 px-3 py-2">
      <Dropdown
        ariaLabel={`Reset effect ${slotNo} grade`}
        value={slot.grade}
        onChange={(v) => onChange?.({ grade: v as AircraftGrade })}
        options={AIRCRAFT_GRADES.map((g) => ({
          value: g,
          label: g,
          icon: <AircraftGradeIcon grade={g} size={16} />,
        }))}
      />
      {/* Searchable and given room to breathe: 29 attributes is a lot to
          scroll, and names like "Monster DMG Reduction" need the width. */}
      <Dropdown
        ariaLabel={`Reset effect ${slotNo} attribute`}
        searchable
        className="min-w-0 flex-1 sm:min-w-[18rem]"
        placeholder="Choose an effect…"
        value={slot.attributeId ?? ""}
        onChange={(v) => onChange?.({ attributeId: v || null })}
        options={[
          { value: "", label: "No effect" },
          ...attributes.map((a) => ({ value: a.id, label: a.name })),
        ]}
      />
      {range && group && (
        <span
          className="text-sm font-black text-accent"
          title={range.exact ? undefined : "Approximate — the game doesn't publish caps for this grade"}
        >
          {range.exact ? "" : "~"}
          {formatResetRange(range, group.unit)}
        </span>
      )}
      {slot.attributeId !== null && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear reset effect ${slotNo}`}
          className="ml-auto h-6 w-6 cursor-pointer rounded-full border border-edge bg-surface text-xs text-ink-dim hover:border-fire hover:text-fire"
        >
          ✕
        </button>
      )}
    </li>
  );
}
