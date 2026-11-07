import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeleteMedia } from "../../api/client";
import type { MediaItem } from "../../api/types";
import { Modal } from "../../components/Modal";
import { formatDate } from "../../lib/date";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Side panel for one file in the Media library: preview, facts, where it is
    used, and delete. Deleting an in-use file is allowed on purpose (the admin
    chose "warn, then allow") — the confirm dialog lists exactly what will lose
    its image so it is never a surprise. */
export function MediaDetails({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const deleteMedia = useDeleteMedia();
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const inUse = item.usage.length > 0;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(imageSrc(item.url));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard can be blocked (insecure origin, permissions): nothing to do
    }
  }

  return (
    <aside className="rounded-xl border border-edge bg-surface p-4" aria-label="File details">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-bold">File details</h2>
        <button type="button" onClick={onClose} aria-label="Close details" className="text-ink-dim hover:text-ink">
          ✕
        </button>
      </div>

      <div className="mt-3 flex h-48 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
        {item.kind === "image" ? (
          <img src={imageSrc(item.url)} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <video src={imageSrc(item.url)} controls className="max-h-full max-w-full" />
        )}
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-dim">File</dt>
          <dd className="truncate font-mono text-xs" title={item.name}>{item.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-dim">Size</dt>
          <dd>{formatBytes(item.size)}</dd>
        </div>
        {item.width && item.height && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-dim">Dimensions</dt>
            <dd>{item.width} × {item.height}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-ink-dim">Added</dt>
          <dd>{formatDate(item.modifiedAt)}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={copyUrl}
        className="mt-3 min-h-11 w-full rounded-lg border border-edge px-3 text-sm hover:border-accent"
      >
        {copied ? "Copied!" : "Copy URL"}
      </button>

      <div className="mt-4">
        <h3 className="text-sm font-semibold">Used by</h3>
        {inUse ? (
          <ul className="mt-1 space-y-1 text-sm">
            {item.usage.map((u) => (
              <li key={`${u.kind}-${u.id}-${u.field}`}>
                <Link to={u.editPath} className="text-accent hover:underline">
                  {u.name}
                </Link>{" "}
                <span className="text-ink-dim">
                  · {u.kind} ({u.field})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink-dim">Not used anywhere.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-4 min-h-11 w-full rounded-lg border border-fire px-3 text-sm font-semibold text-fire hover:bg-fire hover:text-bg"
      >
        Delete permanently
      </button>

      {confirming && (
        <Modal
          label="Delete file"
          onClose={() => setConfirming(false)}
          panelClassName="max-w-md rounded-xl border border-edge bg-surface p-6"
        >
          <h2 className="font-bold">Delete this file?</h2>
          {inUse ? (
            <div className="mt-2 text-sm">
              <p className="text-fire">
                It is still used by {item.usage.length} {item.usage.length === 1 ? "place" : "places"}:
              </p>
              <ul className="mt-1 list-inside list-disc text-ink-dim">
                {item.usage.map((u) => (
                  <li key={`${u.kind}-${u.id}-${u.field}`}>
                    {u.name} ({u.kind}, {u.field})
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-ink-dim">
                The image will be removed from {item.usage.length === 1 ? "that record" : "those records"} (the
                image field is emptied; the records themselves are kept). This can't be undone.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-dim">This can't be undone.</p>
          )}
          {deleteMedia.isError && <p className="mt-2 text-sm text-fire">{(deleteMedia.error as Error).message}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-lg border border-edge px-4 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMedia.mutate(item.name, { onSuccess: onClose })}
              disabled={deleteMedia.isPending}
              className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
            >
              {deleteMedia.isPending ? "Deleting..." : inUse ? "Delete and clear from records" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}
