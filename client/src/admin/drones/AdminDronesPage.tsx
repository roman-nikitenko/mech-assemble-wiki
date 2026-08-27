import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeleteDrone, useDrones } from "../../api/client";
import type { Drone } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

export function AdminDronesPage() {
  const { data, isPending, isError, refetch } = useDrones();
  const deleteDrone = useDeleteDrone();
  const [confirming, setConfirming] = useState<Drone | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Drones</h1>
        <Link
          to="/admin/drones/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New drone
        </Link>
      </div>

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((drone) => (
                <tr key={drone.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {drone.iconUrl ? (
                      <img
                        src={imageSrc(drone.iconUrl)}
                        alt={drone.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    <Link to={`/admin/drones/${drone.id}/edit`} className="hover:text-accent">
                      {drone.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/drones/${drone.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(drone)}
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
            {deleteDrone.isError && (
              <p className="mt-2 text-sm text-fire">{(deleteDrone.error as Error).message}</p>
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
                  deleteDrone.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
                }
                disabled={deleteDrone.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteDrone.isPending ? "Deleting..." : "Delete drone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
