import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeleteModuleQuality, useModuleQualities } from "../../api/client";
import type { ModuleQuality } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

export function AdminModuleQualitiesPage() {
  const { data, isPending, isError, refetch } = useModuleQualities();
  const deleteQuality = useDeleteModuleQuality();
  const [confirming, setConfirming] = useState<ModuleQuality | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Module Qualities</h1>
        <Link
          to="/admin/module-qualities/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New quality
        </Link>
      </div>

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">HP</th>
                <th className="px-4 py-3">ATK</th>
                <th className="px-4 py-3">DEF</th>
                <th className="px-4 py-3">Effects</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).length === 0 && (
                <tr className="border-t border-edge">
                  <td colSpan={8} className="px-4 py-6 text-center text-ink-dim">
                    No module qualities yet.
                  </td>
                </tr>
              )}
              {(data ?? []).map((quality) => (
                <tr key={quality.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {quality.iconUrl ? (
                      <img
                        src={imageSrc(quality.iconUrl)}
                        alt={quality.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    <Link
                      to={`/admin/module-qualities/${quality.id}/edit`}
                      className="hover:text-accent hover:underline"
                    >
                      {quality.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink-dim">{quality.hp}</td>
                  <td className="px-4 py-2 text-ink-dim">{quality.atk}</td>
                  <td className="px-4 py-2 text-ink-dim">{quality.def}</td>
                  <td className="px-4 py-2 text-ink-dim">{quality.effectCount}</td>
                  <td className="px-4 py-2 text-ink-dim">{quality.sortOrder}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/module-qualities/${quality.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(quality)}
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
          <div className="max-w-md rounded-xl border border-fire/40 bg-surface p-6">
            <h2 className="font-bold">Delete {confirming.name}?</h2>
            <p className="mt-2 text-sm text-ink-dim">
              This removes the quality from the catalog.
            </p>
            {deleteQuality.isError && (
              <p className="mt-2 text-sm text-fire">{(deleteQuality.error as Error).message}</p>
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
                  deleteQuality.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
                }
                disabled={deleteQuality.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteQuality.isPending ? "Deleting..." : "Delete quality"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
