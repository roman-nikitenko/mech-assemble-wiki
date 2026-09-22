import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useArsenalSets, useDeleteArsenalSet } from "../../api/client";
import type { ArsenalSet } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

/** The "Set arsenal" tab of the Final Raid page: every gear set with its
    2-piece and 4-piece bonuses. */
export function ArsenalSetsTab() {
  const { data, isPending, isError, refetch } = useArsenalSets();
  const deleteSet = useDeleteArsenalSet();
  const [confirming, setConfirming] = useState<ArsenalSet | null>(null);

  function closeDialog() {
    setConfirming(null);
    // Clear any error from a previous attempt, so reopening the dialog for
    // another set doesn't show that set's stale message.
    deleteSet.reset();
  }

  return (
    <div>
      <div className="flex justify-end">
        <Link
          to="/admin/final-raid/sets/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New set
        </Link>
      </div>

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">2-piece bonus</th>
                <th className="px-4 py-3">4-piece bonus</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr className="border-t border-edge">
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-dim">
                    No sets yet.
                  </td>
                </tr>
              )}
              {data.map((set) => (
                <tr key={set.id} className="border-t border-edge align-top">
                  <td className="px-4 py-2">
                    {set.iconUrl ? (
                      <img src={imageSrc(set.iconUrl)} alt={set.name} className="h-10 w-10 rounded object-contain" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    <Link to={`/admin/final-raid/sets/${set.id}/edit`} className="hover:text-accent">
                      {set.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink-dim">{set.twoPieceBonus ?? "—"}</td>
                  <td className="px-4 py-2 text-ink-dim">{set.fourPieceBonus ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/final-raid/sets/${set.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(set)}
                        className="rounded border border-fire/40 px-2 py-1 text-xs text-fire hover:bg-fire/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
          role="dialog"
          aria-modal="true"
          // z-50: above the admin sidebar (z-40), which would otherwise stay
          // clickable over this "modal" backdrop.
        >
          <div className="max-w-md rounded-xl border border-edge bg-surface p-6">
            <h2 className="font-bold">Delete {confirming.name}?</h2>
            <p className="mt-2 text-sm text-ink-dim">This can't be undone.</p>
            {deleteSet.isError && <p className="mt-2 text-sm text-fire">{(deleteSet.error as Error).message}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeDialog} className="min-h-11 rounded-lg border border-edge px-4 text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteSet.mutate(confirming.id, { onSuccess: closeDialog })}
                disabled={deleteSet.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteSet.isPending ? "Deleting..." : "Delete set"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
