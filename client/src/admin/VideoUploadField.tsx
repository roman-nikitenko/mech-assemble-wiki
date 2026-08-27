import { useState } from "react";
import { imageSrc, uploadVideo } from "../api/client";

interface VideoUploadFieldProps {
  label?: string;
  value: string | null; // current URL (edit mode) or null
  onChange: (url: string | null) => void;
}

/** File input + <video> preview for a preview clip. Uploads immediately on
    selection; the parent form only ever sees the resulting "/uploads/..." URL.
    Mirrors ImageUploadField, but for mp4/webm. */
export function VideoUploadField({ label = "Video", value, onChange }: VideoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onChange(await uploadVideo(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      {value && (
        <video
          src={imageSrc(value)}
          controls
          className="mb-2 w-full max-w-sm rounded-xl border border-edge"
        />
      )}
      <input
        type="file"
        accept="video/mp4,video/webm"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="block text-sm text-ink-dim file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:font-semibold file:text-ink"
      />
      {uploading && <p className="mt-1 text-sm text-ink-dim">Uploading…</p>}
      {error && <p className="mt-1 text-sm text-fire">{error}</p>}
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 text-xs text-ink-dim underline hover:text-fire"
        >
          Remove video
        </button>
      )}
    </div>
  );
}
