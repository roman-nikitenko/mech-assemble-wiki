import { useEffect, useState } from "react";

/** What a codex mapper hands back: either a mapped value or a reason it could
    not be mapped. Both awakening importers (a mech's tree, and the global cost
    ladder) satisfy this, which is why one dialog serves both. */
export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

/** Paste-a-JSON importer. It only ever FILLS THE FORM — nothing is written to
    the database until the admin reviews it and presses Save. That is
    deliberate: this project removed its seed script after a wipe-and-recreate
    destroyed real data twice, and an importer that cannot write cannot repeat it.

    Generic over what it produces: the caller supplies the mapper, so this
    component never knows whether it is filling a mech's tree or a cost ladder. */
export function ImportAwakeningDialog<T>({
  open,
  onClose,
  onImport,
  parse,
  hint,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (value: T) => void;
  parse: (json: unknown) => ParseResult<T>;
  /** One line telling the admin what to paste and what pressing Save will do. */
  hint: string;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // The dialog stays mounted while closed (its parent renders it unconditionally),
  // so without this it would remember a stale error/textarea across opens — clear
  // both the moment it closes, whether via Cancel or a successful import.
  useEffect(() => {
    if (!open) {
      setText("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function fill() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("That could not be read as JSON. Paste a block from the codex.");
      return;
    }
    const result = parse(parsed);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    onImport(result.value);
    setText("");
    onClose();
  }

  return (
    <div className="mt-3 rounded-xl border border-edge bg-surface p-4">
      <h2 className="text-sm font-semibold">Import from the codex</h2>
      <p className="mt-1 text-xs text-ink-dim">{hint}</p>
      <textarea
        aria-label="Codex JSON"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="mt-2 w-full rounded-lg border border-edge bg-bg px-3 py-2 font-mono text-xs"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-fire">
          {error}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={fill}
          className="min-h-11 rounded-lg border border-accent px-4 text-sm"
        >
          Fill the form
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-edge px-4 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
