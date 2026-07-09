import { useState } from "react";
import { imageSrc, uploadImage } from "../api/client";

interface ImageUploadFieldProps {
  label?: string; // "Icon", "Background", ... — defaults to "Image"
  value: string | null; // current URL (edit mode) or null
  onChange: (url: string | null) => void;
}

/** File input + preview. Uploads immediately on selection; the parent form
    only ever sees the resulting "/uploads/..." URL string. */
export function ImageUploadField({ label = "Image", value, onChange }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onChange(await uploadImage(file));
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
        <img
          src={imageSrc(value)}
          alt={`${label} preview`}
          className="mb-2 h-32 w-32 rounded-xl border border-edge object-cover"
        />
      )}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
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
          Remove image
        </button>
      )}
    </div>
  );
}
