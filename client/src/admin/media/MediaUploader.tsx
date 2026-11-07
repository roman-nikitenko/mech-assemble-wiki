import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "../../api/client";

// Same limits the server enforces (routes/uploads.ts). Checking here too means
// a wrong file fails instantly instead of after uploading up to 5 MB.
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const CONCURRENCY = 3;
// A big batch would make the status list as long as the page, so only the most
// recent entries show until the admin asks for all of them.
const COLLAPSED_COUNT = 4;

interface UploadRow {
  id: number;
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

function validate(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PNG, JPEG, or WebP images are allowed.";
  if (file.size > MAX_BYTES) return "Image must be 5 MB or smaller.";
  return null;
}

/** Runs `worker` over `items`, at most `limit` at a time. Small on purpose:
    uploading 20 files in parallel would just make every one of them slow. */
async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await worker(items[next++]);
  });
  await Promise.all(lanes);
}

/** Pick or drop one or more images and upload them. Each file reports its own
    result, so one bad file doesn't hide the others. Calls `onUploaded` once
    with the URLs that succeeded, in the order the files were given. */
export function MediaUploader({ onUploaded }: { onUploaded?: (urls: string[]) => void }) {
  const qc = useQueryClient();
  const inputId = useId();
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [nextId, setNextId] = useState(0);
  const [expanded, setExpanded] = useState(false);

  async function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;

    const base = nextId;
    setNextId(base + files.length);
    const initial: UploadRow[] = files.map((f, i) => {
      const problem = validate(f);
      return problem
        ? { id: base + i, name: f.name, status: "error", error: problem }
        : { id: base + i, name: f.name, status: "uploading" };
    });
    // Appended, so the list reads oldest -> newest and "the last 4" are the latest.
    setRows((prev) => [...prev, ...initial]);

    const urls: (string | undefined)[] = new Array(files.length);
    const jobs = files.map((file, i) => ({ file, i })).filter(({ i }) => initial[i].status === "uploading");
    await runPool(jobs, CONCURRENCY, async ({ file, i }) => {
      const id = base + i;
      try {
        urls[i] = await uploadImage(file);
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "done" } : r)));
      } catch (e) {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "error", error: (e as Error).message } : r)),
        );
      }
    });

    await qc.invalidateQueries({ queryKey: ["media"] });
    const ok = urls.filter((u): u is string => !!u);
    if (ok.length > 0) onUploaded?.(ok);
  }

  const done = rows.filter((r) => r.status === "done").length;
  const failed = rows.filter((r) => r.status === "error").length;
  const pending = rows.length - done - failed;
  const visibleRows = expanded ? rows : rows.slice(-COLLAPSED_COUNT);

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-6 text-center ${
          dragging ? "border-accent bg-surface-2" : "border-edge bg-surface hover:border-accent/60"
        }`}
      >
        <span className="font-semibold">Drop images here, or click to choose files</span>
        <span className="text-sm text-ink-dim">PNG, JPEG or WebP · up to 5 MB each · several at once</span>
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            void handleFiles(e.target.files);
            // reset so choosing the same file again still fires onChange
            e.target.value = "";
          }}
        />
      </label>

      {rows.length > 0 && (
        <div className="mt-3">
          {/* One-line summary so a failure in a long batch is never hidden by the collapsed list. */}
          <div className="flex items-center justify-between gap-3 text-sm" aria-live="polite">
            <span className={failed > 0 ? "text-fire" : "text-ink-dim"}>
              {pending > 0
                ? `Uploading… ${done + failed} of ${rows.length} finished`
                : `${done} uploaded${failed > 0 ? `, ${failed} failed` : ""}`}
            </span>
            {rows.length > COLLAPSED_COUNT && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="min-h-11 shrink-0 text-sm text-accent hover:underline"
              >
                {expanded ? "Show fewer" : `Show all ${rows.length}`}
              </button>
            )}
          </div>
          <ul className={`space-y-1 text-sm ${expanded ? "max-h-64 overflow-y-auto" : ""}`}>
            {visibleRows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{r.name}</span>
                <span
                  className={
                    r.status === "error" ? "shrink-0 text-fire" : r.status === "done" ? "shrink-0 text-accent" : "shrink-0 text-ink-dim"
                  }
                >
                  {r.status === "uploading" ? "Uploading…" : r.status === "done" ? "Uploaded" : r.error}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
