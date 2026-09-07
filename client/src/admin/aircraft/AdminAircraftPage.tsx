import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useAircraft, useDeleteAircraft } from "../../api/client";
import type { Aircraft } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

export function AdminAircraftPage() {
  const { data, isPending, isError, refetch } = useAircraft();
  const deleteAircraft = useDeleteAircraft();
  const [confirming, setConfirming] = useState<Aircraft | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Aircraft</h1>
        <Link
          to="/admin/aircraft/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New aircraft
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
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((aircraft) => (
                <tr key={aircraft.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {/* A 32px cell — plain imageSrc, no srcSet needed here. */}
                    {aircraft.imageUrl ? (
                      <img
                        src={imageSrc(aircraft.imageUrl)}
                        alt={aircraft.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    <Link to={`/admin/aircraft/${aircraft.id}/edit`} className="hover:text-accent">
                      {aircraft.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink-dim">{aircraft.tier}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/aircraft/${aircraft.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(aircraft)}
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
            {deleteAircraft.isError && (
              <p className="mt-2 text-sm text-fire">{(deleteAircraft.error as Error).message}</p>
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
                  deleteAircraft.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
                }
                disabled={deleteAircraft.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteAircraft.isPending ? "Deleting..." : "Delete aircraft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
