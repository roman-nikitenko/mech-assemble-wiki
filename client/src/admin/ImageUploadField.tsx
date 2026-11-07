import { useState } from "react";
import { createPortal } from "react-dom";
import { imageSrc } from "../api/client";
import { MediaPickerModal } from "./media/MediaPickerModal";

interface ImageUploadFieldProps {
  label?: string; // "Icon", "Background", ... — defaults to "Image"
  value: string | null; // current URL (edit mode) or null
  onChange: (url: string | null) => void;
}

/** Preview + a button that opens the Media popup (Upload / Media tabs). The
    parent form still only ever sees the resulting "/uploads/..." URL string,
    so every form using this field kept working when uploads moved into the
    Media library. */
export function ImageUploadField({ label = "Image", value, onChange }: ImageUploadFieldProps) {
  const [picking, setPicking] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      {value && (
        // Hovering the preview shows the file's name at its bottom-left corner,
        // like the link preview a browser shows before you click. No max-width:
        // a file name is longer than the 128px preview, so it extends past it.
        <div className="group relative mb-2 inline-block">
          <img
            src={imageSrc(value)}
            alt={`${label} preview`}
            className="h-32 w-32 rounded-xl border border-edge object-cover"
          />
          <span className="pointer-events-none absolute bottom-0 left-0 z-10 whitespace-nowrap rounded-tr-lg rounded-bl-xl bg-bg/90 px-2 py-0.5 font-mono text-[11px] opacity-0 group-hover:opacity-100">
            {value.split("/").pop()}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={() => setPicking(true)}
        className="min-h-11 rounded-lg bg-surface-2 px-4 text-sm font-semibold text-ink hover:brightness-125"
      >
        {value ? "Change image" : "Choose image"}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-3 text-xs text-ink-dim underline hover:text-fire"
        >
          Remove image
        </button>
      )}
      {/* Portal into <body>, NOT rendered in place: this field lives inside the
          admin <form>, and anything in the DOM subtree of a <form> can submit it
          (Enter in the search box, a tab button with no type). Outside the
          form, the popup can never save the mech by accident. */}
      {picking &&
        createPortal(
          <MediaPickerModal
            label={label}
            current={value}
            onSelect={(url) => {
              onChange(url);
              setPicking(false);
            }}
            onClose={() => setPicking(false)}
          />,
          document.body,
        )}
    </div>
  );
}
