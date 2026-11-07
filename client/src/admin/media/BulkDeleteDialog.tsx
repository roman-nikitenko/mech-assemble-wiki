import { Modal } from "../../components/Modal";

/** Confirmation for deleting several files. The numbers come from the grid's
    own selection, so what the dialog promises is what the server will do. */
export function BulkDeleteDialog({
  count,
  inUseFiles,
  records,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  count: number;
  /** How many of the selected files are still used by something. */
  inUseFiles: number;
  /** Total places (record fields) using those files. */
  records: number;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const noun = count === 1 ? "file" : "files";
  return (
    <Modal label="Delete files" onClose={onCancel} panelClassName="max-w-md rounded-xl border border-edge bg-surface p-6">
      <h2 className="font-bold">
        Delete {count} {noun}?
      </h2>
      {inUseFiles > 0 ? (
        <div className="mt-2 text-sm">
          <p className="text-fire">
            {inUseFiles} of them {inUseFiles === 1 ? "is" : "are"} still used by {records}{" "}
            {records === 1 ? "place" : "places"}.
          </p>
          <p className="mt-2 text-ink-dim">
            The image will be removed from those records (the image fields are emptied; the records themselves are
            kept). This can't be undone.
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-dim">None of them are used anywhere. This can't be undone.</p>
      )}
      {error && <p className="mt-2 text-sm text-fire">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-edge px-4 text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {pending
            ? "Deleting..."
            : inUseFiles > 0
              ? `Delete ${count} ${noun} and clear from records`
              : `Delete ${count} ${noun}`}
        </button>
      </div>
    </Modal>
  );
}
