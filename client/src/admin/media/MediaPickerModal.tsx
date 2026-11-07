import { useState } from "react";
import { Modal } from "../../components/Modal";
import { Tabs } from "../../components/Tabs";
import { MediaLibrary } from "./MediaLibrary";
import { MediaUploader } from "./MediaUploader";

const TABS = ["Upload", "Media"];

/** The "choose an image" popup used by every image field in the admin forms:
    an Upload tab for new files and a Media tab to pick one that already
    exists. Mounting it opens it (see components/Modal.tsx). */
export function MediaPickerModal({
  label,
  current,
  onSelect,
  onClose,
}: {
  /** Names the dialog for screen readers: "Icon", "Background", ... */
  label: string;
  /** The field's current URL, highlighted when the popup opens. */
  current: string | null;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  // Most of the time the image already exists, so open on the library.
  const [tab, setTab] = useState("Media");
  const [selected, setSelected] = useState<string | null>(current);

  return (
    <Modal
      label={`Choose ${label.toLowerCase()}`}
      onClose={onClose}
      panelClassName="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-edge bg-surface p-4"
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h2 className="font-bold">Choose {label.toLowerCase()}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-ink-dim hover:text-ink">
          ✕
        </button>
      </div>

      {/* shrink-0: the tab bar scrolls sideways (overflow-x-auto), which lets a
          flex column squash it to a sliver when the body is tall. Only the body
          below is meant to shrink and scroll. */}
      <div className="shrink-0">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {tab === "Upload" ? (
          <MediaUploader
            onUploaded={(urls) => {
              // Like WordPress: after uploading, jump to the library with the
              // newest upload already selected, ready to use.
              setSelected(urls[urls.length - 1]);
              setTab("Media");
            }}
          />
        ) : (
          <MediaLibrary
            mode="select"
            selected={selected}
            onSelect={(item) => setSelected(item.url)}
          />
        )}
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-end gap-2 border-t border-edge pt-3">
        {/* Full name of the highlighted file (the grid can only show part of it) */}
        {selected && (
          <span className="mr-auto min-w-0 truncate font-mono text-xs text-ink-dim" title={selected}>
            {selected.split("/").pop()}
          </span>
        )}
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-edge px-4 text-sm">
          Cancel
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-50"
        >
          Use this image
        </button>
      </div>
    </Modal>
  );
}
