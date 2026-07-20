import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SkillNodeType } from "../../api/types";
import {
  indentRow,
  moveRow,
  outdentRow,
  removeRow,
  rowDepth,
  subtreeSize,
  type SkillDraft,
} from "./skillTreeDrafts";

const INDENT_PX = 28; // horizontal drag distance that equals one depth level
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TYPES: SkillNodeType[] = ["Normal", "Premium", "Core"];

interface SkillTreeEditorProps {
  drafts: SkillDraft[];
  onChange: (next: SkillDraft[]) => void;
}

/** WordPress-menu-style skill tree editor: expandable rows, ◀▶ indent
    buttons (always available, like WP's accessibility mode), and dnd-kit
    drag on top — BOTH paths call the same pure helpers from
    skillTreeDrafts.ts, so the data can't diverge. */
export function SkillTreeEditor({ drafts, onChange }: SkillTreeEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function addSkill() {
    onChange([
      ...drafts,
      {
        key: crypto.randomUUID(),
        parentKey: null,
        name: "",
        description: "",
        appearanceLevel: 1,
        type: "Normal",
        expanded: true,
      },
    ]);
  }

  function patch(key: string, patchValue: Partial<SkillDraft>) {
    onChange(
      drafts.map((d) => {
        if (d.key !== key) return d;
        const next = { ...d, ...patchValue };
        // Core skills have no name — clear it on switch (mirrors the API).
        if (patchValue.type === "Core") next.name = "";
        return next;
      })
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const from = drafts.findIndex((d) => d.key === active.id);
    const overIndex = drafts.findIndex((d) => d.key === over.id);
    if (from === -1 || overIndex === -1) return;
    const fromDepth = rowDepth(drafts, drafts[from]);
    // horizontal drag distance projects the new depth (WP mechanic);
    // moveRow clamps it to "at most one deeper than the row above".
    const desiredDepth = Math.max(0, fromDepth + Math.round(event.delta.x / INDENT_PX));
    // target position within the list WITHOUT the moving block: dragging
    // DOWN must account for the block (head + its subtree) leaving the list.
    const to = overIndex > from ? overIndex - subtreeSize(drafts, from) + 1 : overIndex;
    onChange(moveRow(drafts, from, to, desiredDepth));
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={drafts.map((d) => d.key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {drafts.map((draft, index) => (
              <SkillRow
                key={draft.key}
                draft={draft}
                depth={rowDepth(drafts, draft)}
                onPatch={(p) => patch(draft.key, p)}
                onIndent={() => onChange(indentRow(drafts, index))}
                onOutdent={() => onChange(outdentRow(drafts, index))}
                onRemove={() => onChange(removeRow(drafts, index))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addSkill}
        className="mt-2 min-h-11 cursor-pointer rounded-lg border border-edge px-4 text-sm hover:border-accent/60"
      >
        + Add skill
      </button>
    </div>
  );
}

function SkillRow({
  draft,
  depth,
  onPatch,
  onIndent,
  onOutdent,
  onRemove,
}: {
  draft: SkillDraft;
  depth: number;
  onPatch: (p: Partial<SkillDraft>) => void;
  onIndent: () => void;
  onOutdent: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: draft.key,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";
  const displayName =
    draft.type === "Core" ? "Core skill" : draft.name.trim() === "" ? "(unnamed skill)" : draft.name;

  // The header bar wears the skill type's color (user-specified hex values,
  // defined as theme tokens in index.css): Normal keeps the plain surface.
  const headerColor =
    draft.type === "Premium"
      ? "bg-skill-premium text-white"
      : draft.type === "Core"
        ? "bg-skill-core text-white"
        : "";
  const headerMuted = draft.type === "Normal" ? "text-ink-dim" : "text-white/70";

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft: depth * INDENT_PX }}
      className="overflow-hidden rounded-xl border border-edge bg-surface"
    >
      <div className={`flex min-h-11 items-center gap-2 px-3 py-2 ${headerColor}`}>
        {/* drag handle — the ONLY part that starts a drag */}
        <button
          type="button"
          aria-label={`Drag ${displayName}`}
          className={`cursor-grab ${headerMuted}`}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <span
          className={
            draft.type === "Core" ? "italic font-semibold" : "font-semibold"
          }
        >
          {displayName}
        </span>
        {depth > 0 && <span className={`text-xs italic ${headerMuted}`}>sub item</span>}
        <span className={`ml-auto text-xs ${headerMuted}`}>{draft.type}</span>
        <button
          type="button"
          aria-label={`Outdent ${displayName}`}
          onClick={onOutdent}
          className={`rounded border border-edge px-1.5 text-xs ${headerMuted} hover:text-ink`}
        >
          ◀
        </button>
        <button
          type="button"
          aria-label={`Indent ${displayName}`}
          onClick={onIndent}
          className={`rounded border border-edge px-1.5 text-xs ${headerMuted} hover:text-ink`}
        >
          ▶
        </button>
        <button
          type="button"
          aria-label={`Toggle ${displayName}`}
          onClick={() => onPatch({ expanded: !draft.expanded })}
          className={`rounded border border-edge px-1.5 text-xs ${headerMuted} hover:text-ink`}
        >
          {draft.expanded ? "▲" : "▼"}
        </button>
        <button
          type="button"
          aria-label={`Remove ${displayName}`}
          onClick={onRemove}
          className="rounded border border-fire/40 px-1.5 text-xs text-fire hover:bg-fire/10"
        >
          ✕
        </button>
      </div>

      {draft.expanded && (
        <div className="space-y-3 border-t border-edge p-3">
          {draft.type !== "Core" && (
            <div>
              <label className="mb-1 block text-sm font-semibold">
                <span className="sr-only">Skill name</span>Name *
              </label>
              <input
                aria-label="Skill name"
                value={draft.name}
                onChange={(e) => onPatch({ name: e.target.value })}
                className={fieldCls}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-semibold">Description</label>
            <textarea
              aria-label="Skill description"
              value={draft.description}
              onChange={(e) => onPatch({ description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">Appearance level</label>
              <select
                aria-label="Appearance level"
                value={draft.appearanceLevel}
                onChange={(e) => onPatch({ appearanceLevel: Number(e.target.value) })}
                className={fieldCls}
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Lv.{lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Type</label>
              <select
                aria-label="Skill type"
                value={draft.type}
                onChange={(e) => onPatch({ type: e.target.value as SkillNodeType })}
                className={fieldCls}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
