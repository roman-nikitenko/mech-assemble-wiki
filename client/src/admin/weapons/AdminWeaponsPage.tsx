import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeleteWeapon, useWeapons } from "../../api/client";
import type { WeaponSummary } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";
import { RankBadge } from "../../components/RankBadge";
import { TypeBadge } from "../../components/TypeBadge";

export function AdminWeaponsPage() {
  const { data, isPending, isError, refetch } = useWeapons();
  const deleteWeapon = useDeleteWeapon();
  const [confirming, setConfirming] = useState<WeaponSummary | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Weapons</h1>
        <Link
          to="/admin/weapons/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New weapon
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
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Owner mech</th>
                <th className="px-4 py-3">Pilot</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((weapon) => (
                <tr key={weapon.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {weapon.imageUrl ? (
                      <img
                        src={imageSrc(weapon.imageUrl)}
                        alt={weapon.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">{weapon.name}</td>
                  <td className="px-4 py-2">
                    <RankBadge rank={weapon.tier} />
                  </td>
                  <td className="px-4 py-2">
                    {weapon.type ? <TypeBadge type={weapon.type} /> : <span className="text-ink-dim">—</span>}
                  </td>
                  <td className="px-4 py-2 text-ink-dim">{weapon.mech?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-ink-dim">{weapon.pilot?.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/weapons/${weapon.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(weapon)}
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
              This removes the weapon, its upgrade tree, and its skins. The
              owner mech and any pilot are NOT deleted — the pilot just loses
              this assignment.
            </p>
            {deleteWeapon.isError && (
              <p className="mt-2 text-sm text-fire">{(deleteWeapon.error as Error).message}</p>
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
                  deleteWeapon.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
                }
                disabled={deleteWeapon.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteWeapon.isPending ? "Deleting..." : "Delete weapon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
