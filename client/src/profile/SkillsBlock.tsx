import { useState } from "react";
import type { SkillNodeRow } from "../api/types";
import { imageSrc } from "../api/client";
import {
  MAX_SLOTS,
  canPick,
  familyOrder,
  lockReason,
  normalizePicks,
  resolvePicks,
  skillDisplayName,
} from "./buildRules";
import { SKILL_CARD, SkillPickCard } from "./SkillPickCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

/** One filled pick slot — a compact version of the palette card: same name
    band and description, no footer. min-h-50 = 200px. With `onRemove` it's
    the editor's removable slot; without, a read-only card for the public
    build pages. */
export function PickedSlot({
  skill,
  cardImageUrl,
  onRemove,
}: {
  skill: SkillNodeRow;
  cardImageUrl?: string | null;
  onRemove?: () => void;
}) {
  const cls = `flex min-h-50 flex-col gap-1 rounded-xl border-2 p-2 text-center ${SKILL_CARD[skill.type].frame}`;
  const content = (
    <>
      <span
        className={`rounded-lg px-1 py-0.5 text-xs font-black ${SKILL_CARD[skill.type].header} ${
          skill.type === "Core" ? "italic" : ""
        }`}
      >
        {skillDisplayName(skill)}
      </span>
      {cardImageUrl && (
        <img src={imageSrc(cardImageUrl)} alt="" className="h-14 w-full object-contain" />
      )}
      {skill.description && (
        <span className="px-0.5 text-xs font-semibold">{skill.description}</span>
      )}
    </>
  );
  if (!onRemove) return <div className={cls}>{content}</div>;
  return (
    <button
      type="button"
      aria-label={`Remove ${skillDisplayName(skill)} from the build`}
      onClick={onRemove}
      className={`${cls} hover:brightness-110`}
    >
      {content}
      <span className="mt-auto text-xs text-ink-dim">✕ remove</span>
    </button>
  );
}

interface SkillsBlockProps {
  title: string;
  skills: SkillNodeRow[];
  pickedIds: string[];
  onPickedChange: (ids: string[]) => void;
  /** Art shown inside every skill card of this block (mech card icon /
      weapon icon). */
  cardImageUrl?: string | null;
  defaultExpanded?: boolean;
  loading?: boolean;
  /** Total Core picks across the WHOLE build (mech + all weapons) — the
      3-core cap is shared, not per block. */
  globalCoreCount: number;
}

/** One expandable "skills" block: header (click to open) → 8 pick slots →
    the full skill palette. The build editor renders one for the mech and
    one per equipped weapon — same rules everywhere (see buildRules). */
export function SkillsBlock({
  title,
  skills,
  pickedIds,
  onPickedChange,
  cardImageUrl,
  defaultExpanded = false,
  loading = false,
  globalCoreCount,
}: SkillsBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [removedNote, setRemovedNote] = useState<string | null>(null);

  // Derived every render — stored ids may reference deleted skills.
  const picks = resolvePicks(skills, pickedIds);
  const palette = familyOrder(skills);
  // Core picks show in the editor's build-wide Core section, not here.
  const normalPicks = picks.filter((p) => p.type !== "Core");

  function addSkill(skill: SkillNodeRow) {
    setRemovedNote(null);
    onPickedChange([...picks.map((p) => p.id), skill.id]);
  }

  function removeSkill(id: string) {
    const result = normalizePicks(picks.filter((p) => p.id !== id));
    setRemovedNote(
      result.removed.length > 0
        ? `Also removed: ${result.removed.map(skillDisplayName).join(", ")} — requirements no longer met.`
        : null
    );
    onPickedChange(result.picks.map((p) => p.id));
  }

  return (
    <section className="mt-5 rounded-xl border border-edge bg-surface">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm font-semibold hover:text-accent"
      >
        <span>
          {title}{" "}
          <span className="text-ink-dim">
            ({normalPicks.length}/{MAX_SLOTS})
          </span>
        </span>
        <span className="text-ink-dim">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-edge p-4">
          <h4 className="mb-2 text-sm font-semibold">
            Skills <span className="text-ink-dim">(tap a slot to remove)</span>
          </h4>
          {removedNote && <p className="mb-2 text-sm text-fire">{removedNote}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: MAX_SLOTS }, (_, i) => {
              const s = normalPicks[i];
              return s ? (
                <PickedSlot
                  key={s.id}
                  skill={s}
                  cardImageUrl={cardImageUrl}
                  onRemove={() => removeSkill(s.id)}
                />
              ) : (
                <div
                  key={`empty-${i}`}
                  className="flex min-h-50 items-center justify-center rounded-xl border-2 border-dashed border-edge text-xs text-ink-dim"
                >
                  Slot {i + 1}
                </div>
              );
            })}
          </div>

          <h4 className="mt-6 mb-2 text-sm font-semibold">All skills</h4>
          {loading ? (
            <LoadingSkeleton variant="cards" />
          ) : skills.length === 0 ? (
            <p className="text-sm text-ink-dim">No skills recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {palette.map((skill) => {
                const picked = picks.some((p) => p.id === skill.id);
                const reason = lockReason(skill, picks, skills, globalCoreCount);
                return (
                  <SkillPickCard
                    key={skill.id}
                    skill={skill}
                    state={picked ? "picked" : reason ? "locked" : "available"}
                    lockReason={reason}
                    // Second click on a picked card un-picks it.
                    onClick={
                      picked
                        ? () => removeSkill(skill.id)
                        : canPick(skill, picks, skills, globalCoreCount)
                          ? () => addSkill(skill)
                          : undefined
                    }
                    imageUrl={cardImageUrl}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
