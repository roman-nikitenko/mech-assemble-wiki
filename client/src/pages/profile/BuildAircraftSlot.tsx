import { useState } from "react";
import { imageSrc } from "../../api/client";
import type {
  Aircraft,
  AircraftAttributeGroup,
  AircraftResetSlot,
  AircraftSelection,
  QualityTier,
} from "../../api/types";
import { AircraftCard } from "../../components/AircraftCard";
import { Dropdown } from "../../components/Dropdown";
import { Modal } from "../../components/Modal";
import { QualityIcon } from "../../components/QualityIcon";
import { aircraftQualityBg } from "../../lib/aircraftQualityBg";
import {
  AIRCRAFT_QUALITIES,
  AIRCRAFT_RESET_SLOTS,
  aircraftResetSlot,
  allAttributes,
  pickedAttributeIds,
} from "../../profile/aircraftResetSlots";
import { BuildAircraftResetSlot } from "./BuildAircraftResetSlot";

/** One of the build's two aircraft: the aircraft itself, its colour-ladder
    quality, and its own 5-roll Reset Effect panel. An attribute used in one of
    those rolls is hidden from the other four (per aircraft — the two aircraft
    roll independently, so the same effect may appear on both). */
export function BuildAircraftSlot({
  index,
  selection,
  aircraft,
  pickable,
  attributeGroups,
  onChange,
  readOnly = false,
}: {
  index: number;
  selection: AircraftSelection;
  aircraft: Aircraft[];
  /** The catalog minus aircraft equipped in the OTHER slot. */
  pickable: Aircraft[];
  attributeGroups: AircraftAttributeGroup[];
  onChange?: (patch: Partial<AircraftSelection>) => void;
  readOnly?: boolean;
}) {
  const slotNo = index + 1;
  const [picking, setPicking] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const equipped =
    selection.aircraftId === null
      ? undefined
      : aircraft.find((a) => a.id === selection.aircraftId);
  const attributes = allAttributes(attributeGroups);
  // Panel art for the chosen quality; undefined falls back to the plain
  // surface-2 tile rather than painting nothing.
  const qualityBg = equipped ? aircraftQualityBg(selection.quality) : undefined;

  function setRoll(rollIndex: number, patch: Partial<AircraftResetSlot>) {
    const current = aircraftResetSlot(selection.resetSlots, rollIndex);
    onChange?.({
      resetSlots: { ...selection.resetSlots, [String(rollIndex)]: { ...current, ...patch } },
    });
  }

  // Read-only with nothing equipped has nothing to say.
  if (readOnly && !equipped) return null;

  return (
    <div className="border border-edge bg-surface p-2">
      <div className="flex flex-wrap items-center gap-3">
        {readOnly ? (
          equipped && (
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              aria-label={`More about ${equipped.name}`}
              className="flex cursor-pointer items-center gap-2 w-[143px] h-25 bg-cover bg-center relative hover:border-accent/60 after:absolute after:inset-0 after:bg-[image:var(--cardBg)] after:bg-contain after:bg-center after:bg-no-repeat after:z-0 after:content-['']"
              style={qualityBg ? { ["--cardBg" as any]: `url(${qualityBg})` } : undefined}
         
            >
              {equipped.imageUrl && (
                <img
                  src={imageSrc(equipped.imageUrl)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain z-10"
                />
              )}
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            aria-label={
              equipped
                ? `Change aircraft ${slotNo} (${equipped.name})`
                : `Add aircraft ${slotNo}`
            }
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-edge bg-surface-2 bg-cover bg-center px-3 hover:border-accent/60"
          >
            {equipped?.imageUrl && (
              <img
                src={imageSrc(equipped.imageUrl)}
                alt=""
                loading="lazy"
                className="h-10 w-10 object-contain"
              />
            )}
            <span className="text-sm font-semibold">
              {equipped?.name ?? `+ Add aircraft ${slotNo}`}
            </span>
          </button>
        )}

        {equipped && !readOnly && (
          <button
            type="button"
            onClick={() => onChange?.({ aircraftId: null, resetSlots: {} })}
            aria-label={`Remove ${equipped.name}`}
            className="min-h-11 cursor-pointer rounded-lg border border-fire/40 px-3 text-sm text-fire hover:bg-fire/10"
          >
            Remove
          </button>
        )}

        {/* Aircraft quality is the colour ladder (Orange→Mythic), the same gems
            the aircraft cards' rank-up rows use — not the Q1-Q13 table. */}
        {equipped &&
          (readOnly ? (
            ""
          ) : (
            <Dropdown
              ariaLabel={`Aircraft ${slotNo} quality`}
              value={selection.quality}
              onChange={(v) => onChange?.({ quality: v as QualityTier })}
              options={AIRCRAFT_QUALITIES.map((t) => ({
                value: t,
                label: t,
                icon: <QualityIcon tier={t} size={16} />,
              }))}
            />
          ))}
      </div>

      {/* The rolls belong to an aircraft, so they only appear once one is on. */}
      {equipped && (
        <>
          <h4 className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-ink-dim">
            Reset Effect
          </h4>
          <ul className="space-y-2">
            {AIRCRAFT_RESET_SLOTS.map((i) => {
              const roll = aircraftResetSlot(selection.resetSlots, i);
              // Attributes used in this aircraft's OTHER rolls; its own pick
              // stays listed so re-opening the row doesn't blank it.
              const takenElsewhere = pickedAttributeIds(selection.resetSlots).filter(
                (id) => id !== roll.attributeId
              );
              return (
                <BuildAircraftResetSlot
                  key={i}
                  index={i}
                  slot={roll}
                  attributes={attributes.filter((a) => !takenElsewhere.includes(a.id))}
                  groups={attributeGroups}
                  readOnly={readOnly}
                  onChange={(patch) => setRoll(i, patch)}
                  onClear={() => setRoll(i, { attributeId: null })}
                />
              );
            })}
          </ul>
        </>
      )}

      {picking && (
        <Modal
          label={`Choose aircraft ${slotNo}`}
          onClose={() => setPicking(false)}
          panelClassName="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-edge bg-surface p-6"
        >
          <div>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-bold">Choose aircraft {slotNo}</h3>
              <button
                type="button"
                onClick={() => setPicking(false)}
                className="min-h-11 cursor-pointer rounded-lg border border-edge px-4 text-sm"
              >
                Cancel
              </button>
            </div>
            {pickable.length === 0 ? (
              <p className="text-sm text-ink-dim">No aircraft available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {pickable.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    aria-label={a.name}
                    onClick={() => {
                      // Rolls belong to the aircraft that rolled them, so
                      // swapping in a different one starts from empty. Re-
                      // picking the SAME aircraft keeps what's already there.
                      onChange?.(
                        a.id === selection.aircraftId
                          ? { aircraftId: a.id }
                          : { aircraftId: a.id, resetSlots: {} }
                      );
                      setPicking(false);
                    }}
                    className="cursor-pointer rounded-xl border border-edge bg-surface-2 p-2 hover:border-accent/60"
                  >
                    {a.imageUrl ? (
                      <img
                        src={imageSrc(a.imageUrl)}
                        alt=""
                        loading="lazy"
                        className="mx-auto h-20 w-full object-contain"
                      />
                    ) : (
                      <span className="flex h-20 items-center justify-center text-2xl font-black text-ink-dim">
                        {a.name.charAt(0)}
                      </span>
                    )}
                    <p className="mt-1 truncate text-center text-sm font-semibold">{a.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showInfo && equipped && (
        <Modal
          label={equipped.name}
          onClose={() => setShowInfo(false)}
          closeOnBackdrop
          panelClassName="relative w-full max-w-sm"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              aria-label="Close"
              className="absolute -right-3 -top-3 z-10 h-8 w-8 cursor-pointer rounded-full border border-edge bg-surface text-sm text-ink-dim hover:border-fire hover:text-fire"
            >
              ✕
            </button>
            <div className="max-h-[85vh] overflow-y-auto">
              <AircraftCard aircraft={equipped} quality={selection.quality} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
