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
}: SkillsBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [removedNote, setRemovedNote] = useState<string | null>(null);

  // Derived every render — stored ids may reference deleted skills.
  const picks = resolvePicks(skills, pickedIds);
  const palette = familyOrder(skills);

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
            ({picks.length}/{MAX_SLOTS})
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
              const s = picks[i];
              return s ? (
                // A compact version of the palette card: same name band and
                // description, no footer. min-h-50 = 200px.
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Remove ${skillDisplayName(s)} from the build`}
                  onClick={() => removeSkill(s.id)}
                  className={`flex min-h-50 flex-col gap-1 rounded-xl border-2 p-2 text-center ${SKILL_CARD[s.type].frame} hover:brightness-110`}
                >
                  <span
                    className={`rounded-lg px-1 py-0.5 text-xs font-black ${SKILL_CARD[s.type].header} ${
                      s.type === "Core" ? "italic" : ""
                    }`}
                  >
                    {skillDisplayName(s)}
                  </span>
                  {cardImageUrl && (
                    <img src={imageSrc(cardImageUrl)} alt="" className="h-14 w-full object-contain" />
                  )}
                  {s.description && (
                    <span className="px-0.5 text-xs font-semibold">{s.description}</span>
                  )}
                  <span className="mt-auto text-xs text-ink-dim">✕ remove</span>
                </button>
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
                const reason = lockReason(skill, picks, skills);
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
                        : canPick(skill, picks, skills)
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
