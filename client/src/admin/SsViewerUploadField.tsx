import { useState } from "react";
import { imageSrc, uploadViewer } from "../api/client";

interface SsViewerUploadFieldProps {
  value: string | null; // current viewer URL (edit mode) or null
  onChange: (url: string | null) => void;
}

/** Browse for a 3D viewer zip. Like VideoUploadField it uploads immediately;
    the form only ever sees the resulting url, saved with the mech. */
export function SsViewerUploadField({ value, onChange }: SsViewerUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onChange(await uploadViewer(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label htmlFor="ss-viewer" className="mb-1 block text-sm font-semibold">3D SS view</label>
      <p className="mb-2 text-xs text-ink-dim">
        The viewer <code>.zip</code> containing <code>index.html</code>. Upload only packs you built or trust: they run
        as part of this site. Save the mech to apply.
      </p>
      <input
        id="ss-viewer"
        type="file"
        accept=".zip,application/zip"
        disabled={uploading}
        // Cleared afterwards so choosing the same file again still triggers an upload.
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="block text-sm text-ink-dim file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:font-semibold file:text-ink"
      />
      {uploading && <p role="status" className="mt-1 text-sm text-ink-dim">Uploading…</p>}
      {error && <p role="alert" className="mt-1 text-sm text-fire">{error}</p>}
      {value && (
        <div className="mt-2 flex gap-4 text-xs">
          <a href={imageSrc(value)} target="_blank" rel="noreferrer" className="text-accent underline">
            Open preview
          </a>
          <button type="button" onClick={() => onChange(null)} className="text-ink-dim underline hover:text-fire">
            Remove 3D view
          </button>
        </div>
      )}
    </div>
  );
}
