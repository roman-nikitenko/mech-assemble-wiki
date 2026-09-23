import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useDeleteHiddenAchievement, useHiddenAchievements } from "../../api/client";
import type { HiddenAchievement } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";
import { ACHIEVEMENT_TIERS } from "../../lib/achievementQuality";

/** The "Hidden achievements" tab of the Final Raid page. */
export function AchievementsTab() {
  const { data, isPending, isError, refetch } = useHiddenAchievements();
  const deleteAchievement = useDeleteHiddenAchievement();
  const [confirming, setConfirming] = useState<HiddenAchievement | null>(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState(""); // "" = every quality

  const filtered = (data ?? []).filter(
    (a) =>
      a.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (tier === "" || a.tier === Number(tier))
  );

  function closeDialog() {
    setConfirming(null);
    deleteAchievement.reset(); // don't show one achievement's error on the next
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            aria-label="Search by name"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-44 rounded-lg border border-edge bg-surface px-3 text-sm"
          />
          <select
            aria-label="Filter by quality"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm"
          >
            <option value="">All qualities</option>
            {ACHIEVEMENT_TIERS.map((t) => (
              <option key={t} value={t}>
                Quality {t}
              </option>
            ))}
          </select>
        </div>
        <Link
          to="/admin/final-raid/achievements/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New achievement
        </Link>
      </div>

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Rewards</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className="border-t border-edge">
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-dim">
                    {data.length === 0 ? "No achievements yet." : "No achievements match your filters."}
                  </td>
                </tr>
              )}
              {filtered.map((achievement) => (
                <tr key={achievement.id} className="border-t border-edge align-top ">
                  <td className="px-4 py-2">
                    {achievement.iconUrl ? (
                      <img
                        src={imageSrc(achievement.iconUrl)}
                        alt={achievement.name}
                        className="h-10 w-10 rounded object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-surface-2" aria-hidden />
                    )}
                    <span className="sr-only">Quality {achievement.tier}</span>
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    <Link
                      to={`/admin/final-raid/achievements/${achievement.id}/edit`}
                      className="hover:text-accent"
                    >
                      {achievement.name}
                    </Link>
                  </td>
                  <td className="max-w-md px-4 py-2 text-ink-dim">{achievement.description}</td>
                  <td className="px-4 py-2 text-ink-dim">
                    {achievement.rewards.length === 0 ? "—" : achievement.rewards.join(", ")}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/final-raid/achievements/${achievement.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(achievement)}
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
          // z-50: above the admin sidebar (z-40).
        >
          <div className="max-w-md rounded-xl border border-edge bg-surface p-6">
            <h2 className="font-bold">Delete {confirming.name}?</h2>
            <p className="mt-2 text-sm text-ink-dim">This can't be undone.</p>
            {deleteAchievement.isError && (
              <p className="mt-2 text-sm text-fire">{(deleteAchievement.error as Error).message}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeDialog} className="min-h-11 rounded-lg border border-edge px-4 text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteAchievement.mutate(confirming.id, { onSuccess: closeDialog })}
                disabled={deleteAchievement.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteAchievement.isPending ? "Deleting..." : "Delete achievement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
