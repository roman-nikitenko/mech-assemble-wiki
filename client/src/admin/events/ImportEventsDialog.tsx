import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { saveEventAssets, uploadImage, useEventAssets, useImportEvents } from "../../api/client";
import type { CalendarEvent } from "../../api/types";
import { EXAMPLE_EVENTS_JSON, imageKey, parseEventsFile, resolveImages } from "../../lib/eventsImport";

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

/** Import JSON: choose the JSON (+ optionally image files) -> preview -> confirm.
    Images are matched by KEY (file name without extension). A key already in the
    registry is reused; a key with a supplied file is uploaded and registered on
    confirm; a key with neither is listed as missing (the event still imports). */
export function ImportEventsDialog({ existing, onClose }: { existing: CalendarEvent[]; onClose: () => void }) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseEventsFile> | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  // Images uploaded (and registered) during THIS dialog. Kept in state so a retry after
  // a failure skips them even before the registry query has refetched.
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const working = useRef(false); // blocks a double-click from starting two imports
  const qc = useQueryClient();
  const registry = useEventAssets();
  const importEvents = useImportEvents();

  const registered = useMemo(
    () => new Map([...(registry.data ?? []).map((a) => [a.key, a.url] as const), ...Object.entries(uploaded)]),
    [registry.data, uploaded],
  );
  const supplied = useMemo(() => {
    const m = new Map<string, File>();
    for (const f of images) {
      const k = imageKey(f.name);
      if (k) m.set(k, f);
    }
    return m;
  }, [images]);

  // Keys the JSON needs that we can neither reuse nor upload.
  const needed = parsed && !parsed.error ? parsed.imageKeys : [];
  const toUpload = needed.filter((k) => !registered.has(k) && supplied.has(k));
  const missing = needed.filter((k) => !registered.has(k) && !supplied.has(k));

  const existingIds = new Set(existing.map((e) => e.gameId).filter((g) => g !== null));
  const isUpdate = (gameId: number | null) => gameId !== null && existingIds.has(gameId);
  const willUpdate = parsed?.error ? [] : (parsed?.events ?? []).filter((e) => isUpdate(e.gameId));
  const willCreate = parsed?.error ? [] : (parsed?.events ?? []).filter((e) => !isUpdate(e.gameId));

  async function chooseJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    importEvents.reset();
    try {
      setParsed(parseEventsFile(JSON.parse(await readText(file))));
    } catch {
      setParsed({ events: [], imageKeys: [], notes: [], error: "That file is not valid JSON." });
    }
  }

  async function confirm() {
    if (!parsed || parsed.error || working.current) return;
    working.current = true;
    setUploadError("");
    try {
      // Upload the new images one at a time (a big batch is ~200 files) and register
      // EACH one right away: if image #120 fails, the first 119 are already remembered,
      // so fixing the problem and clicking Import again does not upload them twice.
      for (const [i, key] of toUpload.entries()) {
        setProgress(`Uploading images ${i + 1}/${toUpload.length}…`);
        const url = await uploadImage(supplied.get(key)!);
        await saveEventAssets([{ key, url }]);
        setUploaded((prev) => ({ ...prev, [key]: url }));
        registered.set(key, url); // this run's own view, before React re-renders
      }
      setProgress("");
      // Write the events with every key replaced by its url.
      importEvents.mutate(resolveImages(parsed.events, registered).events);
    } catch (err) {
      setProgress("");
      setUploadError((err as Error).message);
    } finally {
      working.current = false;
      void qc.invalidateQueries({ queryKey: ["event-assets"] });
    }
  }

  const busy = progress !== "" || importEvents.isPending;

  return (
    <div role="dialog" aria-modal="true" aria-label="Import events" className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-edge bg-surface p-6">
        <h2 className="text-lg font-bold">Import events from JSON</h2>
        <p className="mt-1 text-sm text-ink-dim">
          Choose the game's <code>events.json</code> (or a file exported from this page). Events are matched by their game{" "}
          <code>id</code>: same id = updated, new id = created.
        </p>

        {/* The hint: what the file should look like. */}
        <details className="mt-3 rounded-lg border border-edge p-3 text-xs">
          <summary className="cursor-pointer font-semibold">Example of the expected JSON</summary>
          <p className="mt-2 text-ink-dim">
            Dates are <code>YYYY-MM-DD</code>; <code>end</code> is the last day. Image paths only need the right file name —
            the folder and the extension are ignored. A reward with <code>"amount": null</code> is a pool of possible items.
            <code>seasons</code> and <code>final_raid</code> are optional.
          </p>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-bg p-2">{EXAMPLE_EVENTS_JSON}</pre>
        </details>

        <label className="mt-4 block text-sm font-semibold" htmlFor="events-json">Events JSON file</label>
        <input id="events-json" type="file" accept=".json,application/json" onChange={chooseJson} className="mt-1 block w-full text-sm" />

        <label className="mt-3 block text-sm font-semibold" htmlFor="events-images">Image files</label>
        <input
          id="events-images" type="file" accept="image/*" multiple
          onChange={(e) => setImages([...(e.target.files ?? [])])}
          className="mt-1 block w-full text-sm"
        />
        <p className="mt-1 text-xs text-ink-dim">
          Optional. Pick only NEW images (the game's <code>images</code> folder works too) — ones already uploaded before are reused.
        </p>

        {parsed?.error && <p role="alert" className="mt-3 text-sm text-fire">{parsed.error}</p>}

        {parsed && !parsed.error && !importEvents.isSuccess && (
          <div className="mt-3 space-y-2 text-sm">
            <p><b>{fileName}</b>: {parsed.events.length} events</p>
            {willCreate.length > 0 && <p>{`Will create: ${willCreate.map((e) => e.name).join(", ")}`}</p>}
            {willUpdate.length > 0 && <p>{`Will update: ${willUpdate.map((e) => e.name).join(", ")}`}</p>}
            {willUpdate.length > 0 && (
              <p className="text-xs text-ink-dim">
                Updating replaces dates, rewards and text with the file's version — hand edits to those events are overwritten
                (an image the file can't supply is kept).
              </p>
            )}
            {toUpload.length > 0 && <p>Will upload {toUpload.length} new image{toUpload.length === 1 ? "" : "s"}.</p>}
            {missing.length > 0 && (
              <p className="text-amber-400">
                Missing images ({missing.length}) — those pictures stay empty: {missing.join(", ")}
              </p>
            )}
            {parsed.notes.map((n) => <p key={n} className="text-xs text-ink-dim">{n}</p>)}
          </div>
        )}

        {progress && <p role="status" className="mt-3 text-sm text-ink-dim">{progress}</p>}
        {(uploadError || importEvents.isError) && (
          <p role="alert" className="mt-3 text-sm text-fire">{uploadError || (importEvents.error as Error).message}</p>
        )}
        {importEvents.isSuccess && (
          <p role="status" className="mt-3 text-sm text-accent">
            Done: {importEvents.data.created} created, {importEvents.data.updated} updated.
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-edge px-4 text-sm">
            {importEvents.isSuccess ? "Close" : "Cancel"}
          </button>
          {!importEvents.isSuccess && (
            <button
              type="button"
              disabled={!parsed || !!parsed.error || busy || registry.isPending}
              onClick={confirm}
              className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Importing…" : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
