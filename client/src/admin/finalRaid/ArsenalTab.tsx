import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useArsenalPieces, useArsenalSets, useDeleteArsenalPiece } from "../../api/client";
import type { ArsenalPiece, ArsenalSlot } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";
import { ARSENAL_SLOTS } from "../../lib/arsenalSlots";
import { ArsenalQualityRange } from "../../components/ArsenalQualityLabel";

// The "Set" filter holds either one of these two words or a specific set id.
// Set ids are UUIDs, so they can never collide with "normal" / "any-set".
const NORMAL = "normal";
const ANY_SET = "any-set";

/** Does `piece` pass the Set filter? "" = everything. */
function matchesSetFilter(piece: ArsenalPiece, filter: string): boolean {
  if (filter === "") return true;
  if (filter === NORMAL) return piece.setId === null;
  if (filter === ANY_SET) return piece.setId !== null;
  return piece.setId === filter;
}

const selectClass = "min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm";

/** The "Arsenal" tab of the Final Raid page: every gear piece, normal and set. */
export function ArsenalTab() {
  const { data, isPending, isError, refetch } = useArsenalPieces();
  const sets = useArsenalSets();
  const deletePiece = useDeleteArsenalPiece();
  const [confirming, setConfirming] = useState<ArsenalPiece | null>(null);
  // Client-side filters; "" = no filter.
  const [search, setSearch] = useState("");
  const [slot, setSlot] = useState<ArsenalSlot | "">("");
  const [setFilter, setSetFilter] = useState("");

  const filtered = (data ?? []).filter(
    (piece) =>
      piece.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (slot === "" || piece.slot === slot) &&
      matchesSetFilter(piece, setFilter)
  );

  function closeDialog() {
    setConfirming(null);
    deletePiece.reset(); // don't carry one piece's error into the next dialog
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
            aria-label="Filter by slot"
            value={slot}
            onChange={(e) => setSlot(e.target.value as ArsenalSlot | "")}
            className={selectClass}
          >
            <option value="">All slots</option>
            {ARSENAL_SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by set"
            value={setFilter}
            onChange={(e) => setSetFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">Normal + set</option>
            <option value={NORMAL}>Normal arsenal only</option>
            <option value={ANY_SET}>Set arsenal only</option>
            {(sets.data ?? []).length > 0 && (
              <optgroup label="One set">
                {(sets.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <Link
          to="/admin/final-raid/arsenal/new"
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:brightness-110"
        >
          + New piece
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
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3">Set</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className="border-t border-edge">
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-dim">
                    {data.length === 0 ? "No pieces yet." : "No pieces match your filters."}
                  </td>
                </tr>
              )}
              {filtered.map((piece) => (
                <tr key={piece.id} className="border-t border-edge">
                  <td className="px-4 py-2">
                    {piece.iconUrl ? (
                      <img
                        src={imageSrc(piece.iconUrl)}
                        alt={piece.name}
                        className="h-10 w-10 rounded object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-surface-2" aria-hidden />
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    <Link to={`/admin/final-raid/arsenal/${piece.id}/edit`} className="hover:text-accent">
                      {piece.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink-dim">{piece.slot}</td>
                  <td className="px-4 py-2">
                    <ArsenalQualityRange min={piece.qualityMin} max={piece.qualityMax} />
                  </td>
                  <td className="px-4 py-2 text-ink-dim">{piece.set?.name ?? "Normal"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/final-raid/arsenal/${piece.id}/edit`}
                        className="rounded border border-edge px-2 py-1 text-xs hover:border-accent/60"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirming(piece)}
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
            {deletePiece.isError && <p className="mt-2 text-sm text-fire">{(deletePiece.error as Error).message}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeDialog} className="min-h-11 rounded-lg border border-edge px-4 text-sm">
                Cancel
              </button>
              <button
                onClick={() => deletePiece.mutate(confirming.id, { onSuccess: closeDialog })}
                disabled={deletePiece.isPending}
                className="min-h-11 rounded-lg bg-fire px-4 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
              >
                {deletePiece.isPending ? "Deleting..." : "Delete piece"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
