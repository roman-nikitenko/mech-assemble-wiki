import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeletePilot, usePilots } from "../../api/client";
import type { Pilot } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

export function AdminPilotsPage() {
  const { data, isPending, isError, refetch } = usePilots();
  const deletePilot = useDeletePilot();
  const [confirming, setConfirming] = useState<Pilot | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Pilots</h1>
        <Link
          to="/admin/pilots/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New pilot
        </Link>
      </div>

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Linked to</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((pilot) => (
                <tr key={pilot.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {pilot.iconUrl ? (
                      <img
                        src={imageSrc(pilot.iconUrl)}
                        alt={pilot.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">{pilot.name}</td>
                  <td className="px-4 py-2 text-ink-dim">
                    {pilot.mech?.name ?? pilot.weapon?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/pilots/${pilot.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(pilot)}
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
            <p className="mt-2 text-sm text-ink-dim">
              This removes the pilot. The linked mech is NOT affected — its
              cockpit simply becomes empty.
            </p>
            {deletePilot.isError && (
              <p className="mt-2 text-sm text-fire">{(deletePilot.error as Error).message}</p>
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
                  deletePilot.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
                }
                disabled={deletePilot.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deletePilot.isPending ? "Deleting..." : "Delete pilot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
