import { useState } from "react";
import { imageSrc, useArsenalPieces, useArsenalSets } from "../../api/client";
import type { ArsenalPiece, ArsenalSet } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";
import { ArsenalQualityRange } from "../../components/ArsenalQualityLabel";
import { ARSENAL_QUALITIES, arsenalQualityName } from "../../lib/arsenalQualities";
import { ARSENAL_SLOTS } from "../../lib/arsenalSlots";
import { Dropdown } from "../../components/Dropdown";
import { ArsenalPieceCard } from "./ArsenalPieceCard";

/** Slot order as the game lists it, for sorting; -1 keeps an unknown slot
    (only possible if the enum ever grows) at the front rather than dropping it. */
function slotRank(piece: ArsenalPiece): number {
  return ARSENAL_SLOTS.indexOf(piece.slot);
}

function bySlot(a: ArsenalPiece, b: ArsenalPiece): number {
  return slotRank(a) - slotRank(b) || a.name.localeCompare(b.name);
}

/** The quality span a set covers: the lowest quality any of its pieces starts
    at, through the highest any reaches. Null when the set has no pieces yet. */
function qualitySpan(pieces: ArsenalPiece[]): { min: number; max: number } | null {
  if (pieces.length === 0) return null;
  return {
    min: Math.min(...pieces.map((p) => p.qualityMin)),
    max: Math.max(...pieces.map((p) => p.qualityMax)),
  };
}

/** One set: its emblem on the left, then the name, the 2-piece and 4-piece
    bonuses, the quality span, and the pieces it is made of. */
function SetCard({ set, pieces }: { set: ArsenalSet; pieces: ArsenalPiece[] }) {
  const span = qualitySpan(pieces);

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-edge bg-surface sm:flex-row ">
      <div className="flex shrink-0 items-center justify-center border-edge bg-surface-2/40 p-6 sm:w-48 sm:border-r">
        {set.iconUrl ? (
          <img src={imageSrc(set.iconUrl)} alt="" className="h-35 w-35 object-contain" />
        ) : (
          <div className="h-28 w-28 rounded bg-surface-2" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-black tracking-wide uppercase">{set.name}</h3>
          {span && <ArsenalQualityRange min={span.min} max={span.max} />}
        </div>

        <dl className="mt-4 space-y-3">
          {/* Both rows always show, so every set reads the same way. */}
          {(
            [
              ["2-piece", set.twoPieceBonus],
              ["4-piece", set.fourPieceBonus],
            ] as const
          ).map(([label, bonus]) => (
            <div key={label} className="flex gap-4">
              <dt className="w-20 shrink-0 pt-0.5 font-mono text-xs tracking-widest text-fire uppercase">
                {label}
              </dt>
              <dd className="text-ink">{bonus ?? "—"}</dd>
            </div>
          ))}
        </dl>

        {pieces.length > 0 && (
          <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm text-ink-dim sm:grid-cols-2">
            {pieces.map((piece) => (
              <li key={piece.id} className="flex items-center gap-2" title={piece.slot}>
                {piece.iconUrl ? (
                  <img src={imageSrc(piece.iconUrl)} alt="" aria-hidden className="h-8 w-8 object-contain" />
                ) : (
                  <span className="h-7 w-7 rounded bg-surface-2" aria-hidden />
                )}
                {piece.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** The Arsenal sub-tab: the default (non-set) gear first, then every set with
    its bonuses and its own pieces. */
export function ArsenalSection() {
  const pieces = useArsenalPieces();
  const sets = useArsenalSets();
  const [search, setSearch] = useState("");
  // null until the data arrives: the default is the best quality the default
  // gear actually reaches, which isn't known before the first render.
  const [quality, setQuality] = useState<number | null>(null);

  if (pieces.isPending || sets.isPending) return <LoadingSkeleton variant="cards" />;
  if (pieces.isError || sets.isError) {
    return (
      <ErrorPanel
        onRetry={() => {
          pieces.refetch();
          sets.refetch();
        }}
      />
    );
  }

  const query = search.trim().toLowerCase();
  const matching = pieces.data.filter((p) => !query || p.name.toLowerCase().includes(query));

  const defaultPieces = pieces.data.filter((p) => p.setId === null);
  const topQuality = Math.max(1, ...defaultPieces.map((p) => p.qualityMax));
  const shownQuality = quality ?? topQuality;
  // Gear that doesn't exist at the chosen quality drops out — a Rune stops at
  // Epic, so picking Supreme hides it rather than showing numbers it can't roll.
  const defaults = matching
    .filter((p) => p.setId === null && p.qualityMin <= shownQuality && shownQuality <= p.qualityMax)
    .sort(bySlot);
  // Group the pieces by set from the ONE pieces request — /api/arsenal-sets
  // returns only a count, and a second request per set would be wasteful.
  // Built from EVERY piece, not just the ones matching the search: a set card
  // always shows its whole contents and true quality span, and the search only
  // decides which set cards appear.
  const bySetId = new Map<string, ArsenalPiece[]>();
  for (const piece of pieces.data) {
    if (piece.setId === null) continue;
    const list = bySetId.get(piece.setId) ?? [];
    list.push(piece);
    bySetId.set(piece.setId, list);
  }
  // While searching, a set survives when its own name matches or one of its
  // pieces does; with an empty search every set is listed, pieces or not.
  const matchingIds = new Set(matching.map((p) => p.id));
  const visibleSets = sets.data.filter(
    (s) =>
      !query ||
      s.name.toLowerCase().includes(query) ||
      (bySetId.get(s.id) ?? []).some((p) => matchingIds.has(p.id))
  );

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search arsenal..."
        aria-label="Search arsenal"
        className="min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm sm:w-64"
      />

      {pieces.data.length === 0 && sets.data.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No arsenal recorded yet.</p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-xl font-black tracking-tight">Default arsenal</h2>
            <p className="mt-1 text-sm text-ink-dim">
              Gear that belongs to no set. Its ATK, HP and DEF follow the quality it drops at, so pick a
              quality to see what a piece can roll there.
            </p>
            <div className="mt-3 sm:w-64">
              <Dropdown
                ariaLabel="Quality"
                options={ARSENAL_QUALITIES.map((q) => ({
                  value: String(q.quality),
                  label: q.name,
                  // The game's own colour for that quality, as a dot.
                  icon: (
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: q.colour }}
                      aria-hidden
                    />
                  ),
                }))}
                value={String(shownQuality)}
                onChange={(value) => setQuality(Number(value))}
              />
            </div>
            {defaults.length === 0 ? (
              <p className="mt-4 text-sm text-ink-dim">
                No default gear at {arsenalQualityName(shownQuality)}.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {defaults.map((piece) => (
                  <ArsenalPieceCard key={piece.id} piece={piece} quality={shownQuality} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-black tracking-tight">Set arsenal</h2>

            
            <p className="mt-1 text-sm text-ink-dim">
              Wearing 2 pieces of a set grants its 2-pc bonus; 4 pieces grant the 4-pc bonus too.
            </p>
            {visibleSets.length === 0 ? (
              <p className="mt-4 text-sm text-ink-dim">No sets match.</p>
            ) : (
              <div className="mt-4 gap-2 grid grid-cols-1 lg:grid-cols-2">
                {visibleSets.map((set) => (
                  <SetCard key={set.id} set={set} pieces={(bySetId.get(set.id) ?? []).sort(bySlot)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
