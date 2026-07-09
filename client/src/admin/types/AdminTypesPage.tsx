import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeleteType, useTypes } from "../../api/client";
import type { GameType } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

export function AdminTypesPage() {
  const { data, isPending, isError, refetch } = useTypes();
  const deleteType = useDeleteType();
  const [confirming, setConfirming] = useState<GameType | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Types</h1>
        <Link
          to="/admin/types/new"
          className="min-h-11 rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New type
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
              {data.map((type) => (
                <tr key={type.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {type.iconUrl ? (
                      <img
                        src={imageSrc(type.iconUrl)}
                        alt={type.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">{type.name}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/types/${type.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(type)}
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
              If any mech or weapon still uses this type, the API will refuse
              and nothing happens — reassign them first.
            </p>
            {deleteType.isError && (
              <p className="mt-2 text-sm text-fire">{(deleteType.error as Error).message}</p>
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
                  deleteType.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
                }
                disabled={deleteType.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteType.isPending ? "Deleting..." : "Delete type"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
