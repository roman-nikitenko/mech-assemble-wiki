import { useState } from "react";
import { useImportChips } from "../../api/client";
import type { Chip } from "../../api/types";
import { parseChipsFile, type ImportParse } from "../../lib/chipsImport";

// FileReader rather than file.text(): it works in every browser and in the
// jsdom test environment, which has no Blob.text().
function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Import JSON: choose a file -> preview what will happen -> confirm.
    Accepts the game's chips_data.json and this page's own export. Unlike the
    awakening importer this WRITES on confirm (upsert by name), which is why it
    shows exactly which chips will be replaced first. */
export function ImportChipsDialog({
  existing,
  onClose,
}: {
  existing: Chip[];
  onClose: () => void;
}) {
  const [parsed, setParsed] = useState<ImportParse | null>(null);
  const [fileName, setFileName] = useState("");
  const importChips = useImportChips();

  async function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    importChips.reset();
    setParsed(parseChipsFile(await readText(file)));
  }

  const existingNames = new Set(existing.map((c) => c.name));
  const willUpdate = parsed?.ok ? parsed.chips.filter((c) => existingNames.has(c.name)) : [];
  const willCreate = parsed?.ok ? parsed.chips.filter((c) => !existingNames.has(c.name)) : [];

  return (
    <div role="dialog" aria-modal="true" aria-label="Import chips" className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-edge bg-surface p-6">
        <h2 className="text-lg font-bold">Import chips from JSON</h2>
        <p className="mt-1 text-sm text-ink-dim">
          Choose the game's <code>chips_data.json</code> or a file you exported from this page.
        </p>
        <input type="file" accept=".json,application/json" aria-label="Chips JSON file" onChange={choose} className="mt-3 block w-full text-sm" />

        {parsed && !parsed.ok && (
          <p role="alert" className="mt-3 text-sm text-fire">
            {parsed.message}
          </p>
        )}

        {parsed?.ok && !importChips.isSuccess && (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <b>{fileName}</b>: {parsed.chips.length} chips · {parsed.qualityCount} qualities
              {parsed.source === "game" ? " (game format)" : " (export format)"}
            </p>
            {willUpdate.length > 0 && (
              <p>
                Will <b>replace the data of</b>: {willUpdate.map((c) => c.name).join(", ")}
              </p>
            )}
            {willCreate.length > 0 && (
              <p>
                Will <b>create</b>: {willCreate.map((c) => c.name).join(", ")}
              </p>
            )}
            {willUpdate.length > 0 && (
              <p className="text-xs text-ink-dim">Replaced chips lose any edits made here — export first if unsure.</p>
            )}
          </div>
        )}

        {importChips.isError && (
          <p role="alert" className="mt-3 text-sm text-fire">
            {(importChips.error as Error).message}
          </p>
        )}
        {importChips.isSuccess && (
          <p role="status" className="mt-3 text-sm text-accent">
            Done: {importChips.data.created} created, {importChips.data.updated} updated.
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-edge px-4 text-sm">
            {importChips.isSuccess ? "Close" : "Cancel"}
          </button>
          {!importChips.isSuccess && (
            <button
              type="button"
              disabled={!parsed?.ok || importChips.isPending}
              onClick={() => parsed?.ok && importChips.mutate(parsed.chips)}
              className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
            >
              {importChips.isPending ? "Importing…" : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
