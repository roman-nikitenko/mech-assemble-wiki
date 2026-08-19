import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeleteModule, useModules } from "../../api/client";
import type { ModuleSummary } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";

export function AdminModulesPage() {
  const { data, isPending, isError, refetch } = useModules();
  const deleteModule = useDeleteModule();
  // The module awaiting delete confirmation, or null when the dialog is closed.
  const [confirming, setConfirming] = useState<ModuleSummary | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Modules</h1>
        <Link
          to="/admin/modules/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New module
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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).length === 0 && (
                <tr className="border-t border-edge">
                  <td colSpan={3} className="px-4 py-6 text-center text-ink-dim">
                    No modules yet.
                  </td>
                </tr>
              )}
              {(data ?? []).map((module) => (
                <tr key={module.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {module.iconUrl ? (
                      <img
                        src={imageSrc(module.iconUrl)}
                        alt={module.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    <Link
                      to={`/admin/modules/${module.id}/edit`}
                      className="hover:text-accent hover:underline"
                    >
                      {module.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/modules/${module.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(module)}
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
              This permanently removes the module. There is no undo.
            </p>
            {deleteModule.isError && (
              <p className="mt-2 text-sm text-fire">{(deleteModule.error as Error).message}</p>
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
                  deleteModule.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
                }
                disabled={deleteModule.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteModule.isPending ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
