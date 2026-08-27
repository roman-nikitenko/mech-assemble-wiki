import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeleteDroneType, useDroneTypes } from "../../api/client";
import type { DroneType } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

/** The drone type catalog — second tab of the Types admin page. */
export function DroneTypesTab() {
  const { data, isPending, isError, refetch } = useDroneTypes();
  const deleteDroneType = useDeleteDroneType();
  const [confirming, setConfirming] = useState<DroneType | null>(null);

  return (
    <div>
      <div className="flex justify-end">
        <Link
          to="/admin/drone-types/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New drone type
        </Link>
      </div>

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((droneType) => (
                <tr key={droneType.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {droneType.iconUrl ? (
                      <img
                        src={imageSrc(droneType.iconUrl)}
                        alt={droneType.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    <Link to={`/admin/drone-types/${droneType.id}/edit`} className="hover:text-accent">
                      {droneType.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/drone-types/${droneType.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(droneType)}
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
          className="fixed inset-0 z-10 flex items-center justify-center bg-bg/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md rounded-xl border border-edge bg-surface p-6">
            <h2 className="font-bold">Delete {confirming.name}?</h2>
            <p className="mt-2 text-sm text-ink-dim">This can't be undone.</p>
            {deleteDroneType.isError && (
              <p className="mt-2 text-sm text-fire">{(deleteDroneType.error as Error).message}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(null)}
                className="min-h-11 rounded-lg border border-edge px-4 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteDroneType.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
                }
                disabled={deleteDroneType.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteDroneType.isPending ? "Deleting..." : "Delete drone type"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
