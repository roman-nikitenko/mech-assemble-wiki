import { useState } from "react";
import { Link } from "react-router-dom";
import { useChips, useDeleteChip } from "../../api/client";
import type { Chip, ChipCategory } from "../../api/types";
import { ErrorPanel } from "../../components/ErrorPanel";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { chipIcon, chipPartIcon } from "../../lib/chipArt";
import { CHIP_CATEGORIES, CHIP_QUALITIES } from "../../lib/chipQualities";
import { downloadChipsJson } from "../../lib/chipsExport";
import { ImportChipsDialog } from "./ImportChipsDialog";

export function AdminChipsPage() {
  const { data, isPending, isError, refetch } = useChips();
  const deleteChip = useDeleteChip();
  const [confirming, setConfirming] = useState<Chip | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ChipCategory | "">("");

  const query = search.trim().toLowerCase();
  const visible = (data ?? []).filter(
    (c) => (!query || c.name.toLowerCase().includes(query)) && (category === "" || c.category === category),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Chips</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setImporting(true)}
            className="min-h-11 cursor-pointer rounded-lg border border-edge px-4 py-2 text-sm font-semibold hover:border-accent/60"
          >
            Import JSON
          </button>
          <button
            type="button"
            disabled={!data || data.length === 0}
            onClick={() => data && downloadChipsJson(data)}
            className="min-h-11 cursor-pointer rounded-lg border border-edge px-4 py-2 text-sm font-semibold hover:border-accent/60 disabled:opacity-50"
          >
            Export JSON
          </button>
          <Link to="/admin/chips/new" className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110">
            + New chip
          </Link>
        </div>
      </div>

      {/* The hint the admin asked for: how exporting fits with importing. */}
      <p className="mt-2 max-w-2xl text-xs text-ink-dim">
        <b>Export JSON</b> downloads every chip as one file (use it as a backup before a game patch). <b>Import JSON</b>{" "}
        accepts that same file back — and the game's own <code>chips_data.json</code>. Chips are matched by name: same
        name = replaced, new name = created.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Search by name"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 w-44 rounded-lg border border-edge bg-surface px-3 text-sm"
        />
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {CHIP_CATEGORIES.map((c) => {
            const active = category === c.category;
            return (
              <button
                key={c.category}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(active ? "" : c.category)}
                className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold ${
                  active ? "border-accent bg-accent/15 text-accent" : "border-edge bg-surface text-ink-dim hover:text-ink"
                }`}
              >
                {c.category}
              </button>
            );
          })}
        </div>
      </div>

      {isPending ? (
        <LoadingSkeleton variant="detail" />
      ) : isError ? (
        <ErrorPanel onRetry={() => refetch()} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Part</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Qualities filled</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((chip) => {
                const filled = new Set(chip.qualities.map((q) => q.quality));
                const partIcon = chipPartIcon(chip.category);
                return (
                  <tr key={chip.id} className="border-t border-edge">
                    <td className="px-4 py-2">
                      {partIcon ? <img src={partIcon} alt="" className="h-8 w-8 object-contain" /> : <div className="h-8 w-8" />}
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      <Link to={`/admin/chips/${chip.id}/edit`} className="hover:text-accent">
                        {chip.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{chip.category}</td>
                    <td className="px-4 py-2">
                      {/* Nine gems; dim = no data yet for that quality. */}
                      <div className="flex gap-0.5" aria-label={`${filled.size} of ${CHIP_QUALITIES.length} qualities filled`}>
                        {CHIP_QUALITIES.map((q) => {
                          const icon = chipIcon(chip.category, q.quality);
                          return icon ? (
                            <img key={q.quality} src={icon} alt="" title={q.name} className={`h-6 w-6 object-contain ${filled.has(q.quality) ? "" : "opacity-25 grayscale"}`} />
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Link to={`/admin/chips/${chip.id}/edit`} className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60">
                          Edit
                        </Link>
                        <button
                          onClick={() => setConfirming(chip)}
                          className="rounded border border-fire/40 px-2 py-1 text-xs text-fire hover:bg-fire/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-dim">
                    {data.length === 0 ? "No chips yet — add one or use Import JSON." : "No chips match."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {importing && <ImportChipsDialog existing={data ?? []} onClose={() => setImporting(false)} />}

      {confirming && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-bg/80 p-4" role="dialog" aria-modal="true">
          <div className="max-w-md rounded-xl border border-edge bg-surface p-6">
            <h2 className="font-bold">Delete {confirming.name}?</h2>
            <p className="mt-2 text-sm text-ink-dim">All its qualities go with it. This can't be undone.</p>
            {deleteChip.isError && <p className="mt-2 text-sm text-fire">{(deleteChip.error as Error).message}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirming(null)} className="min-h-11 rounded-lg border border-edge px-4 text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteChip.mutate(confirming.id, { onSuccess: () => setConfirming(null) })}
                disabled={deleteChip.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deleteChip.isPending ? "Deleting..." : "Delete chip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
