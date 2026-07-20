import { useRef } from "react";
import type { MechSummary, WeaponSummary } from "../api/types";
import { NotePreview } from "./NotePreview";

interface NotesFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  mechs: MechSummary[];
  weapons: WeaponSummary[];
}

/** Notes textarea with a small formatting toolbar (inserts noteMarkup
    markers, GitHub-comment style) and a live preview underneath. */
export function NotesField({ id, value, onChange, mechs, weapons }: NotesFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Wrap the current selection (or nothing, leaving the cursor between markers).
  function surround(marker: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + marker + value.slice(start, end) + marker + value.slice(end));
  }

  // Headings are whole-line: put the prefix at the start of the cursor's line.
  function prefixLine(prefix: string) {
    const at = ref.current?.selectionStart ?? value.length;
    const lineStart = value.lastIndexOf("\n", at - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
  }

  function insertAtCursor(snippet: string) {
    const at = ref.current?.selectionStart ?? value.length;
    onChange(value.slice(0, at) + snippet + value.slice(at));
  }

  const btn = "min-h-9 rounded-lg border border-edge px-3 text-xs font-semibold hover:border-accent/60";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => prefixLine("## ")} className={btn}>
          H2
        </button>
        <button type="button" onClick={() => prefixLine("### ")} className={btn}>
          H3
        </button>
        <button type="button" aria-label="Bold" onClick={() => surround("**")} className={`${btn} font-black`}>
          B
        </button>
        <button type="button" aria-label="Italic" onClick={() => surround("*")} className={`${btn} italic`}>
          I
        </button>
        {/* value stays "" so the select resets after every insert */}
        <select
          aria-label="Insert mention"
          value=""
          onChange={(e) => {
            if (e.target.value) insertAtCursor(`#[${e.target.value}]`);
          }}
          className="min-h-9 rounded-lg border border-edge bg-surface px-2 text-xs"
        >
          <option value=""># Mention…</option>
          <optgroup label="Mechs">
            {mechs.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Weapons">
            {weapons.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
        placeholder="Strategy, rotation, why these skills… Formatting: ## heading, **bold**, *italic*, # Mention."
      />
      {value.trim() !== "" && (
        <div className="mt-2 rounded-xl border border-edge bg-surface/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-dim">Preview</p>
          <NotePreview text={value} mechs={mechs} weapons={weapons} />
        </div>
      )}
    </div>
  );
}
