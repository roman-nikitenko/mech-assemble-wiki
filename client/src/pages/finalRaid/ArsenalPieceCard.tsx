import { useState, type CSSProperties } from "react";
import { imageSrc } from "../../api/client";
import type { ArsenalPiece } from "../../api/types";
import { arsenalQualityArt } from "../../lib/arsenalQualities";
import { affixRangeParts, arsenalAffixSlots, arsenalStatRanges, arsenalVariant } from "../../lib/arsenalStats";

/** One piece of default gear at the chosen quality: its art, the HP/ATK/DEF
    it can roll, and the bonus effects it can carry.

    Everything below the name depends on `quality` — in this mode the stats
    follow the quality, not the piece, and a piece rolls somewhere between the
    quality's floor and its full value. */
export function ArsenalPieceCard({ piece, quality }: { piece: ArsenalPiece; quality: number }) {
  const stats = arsenalStatRanges(quality);
  const art = arsenalQualityArt(quality);
  const affixSlots = arsenalAffixSlots(quality, piece.slot, arsenalVariant(piece.name));
  const [activeSlot, setActiveSlot] = useState(0);
  // The chosen tab can outlive a quality change that removes that slot.
  const slot = affixSlots[Math.min(activeSlot, affixSlots.length - 1)];

  return (
    <article className="flex flex-col overflow-hidden border-edge bg-surface">
      <div
        className="relative flex gap-3 bg-cover bg-center p-3 after:absolute after:inset-0 after:z-0 after:bg-(image:--bg-url) after:bg-cover after:bg-no-repeat"
        style={{ "--bg-url": art.header ? `url(${art.header})` : "" } as CSSProperties}
      >
        <div
          className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center bg-cover bg-center"
          style={art.iconFrame ? { backgroundImage: `url(${art.iconFrame})` } : undefined}
        >
          {piece.iconUrl ? (
            <img src={imageSrc(piece.iconUrl)} alt="" className="h-full w-full object-contain" />
          ) : (
            <div className="h-10 w-10 rounded bg-surface-2/60" aria-hidden />
          )}

          {/* One diamond per "+N" step, along the bottom edge of the frame. */}
          {art.mark && (
            <div className="absolute -bottom-1 flex justify-center" aria-hidden>
              {Array.from({ length: art.markCount }, (_, i) => (
                <img key={i} src={art.mark} alt="" className="h-3 w-3 object-contain" />
              ))}
            </div>
          )}
        </div>

        <h3 className="z-10 self-center font-black tracking-tight text-white drop-shadow">{piece.name}</h3>
      </div>

      {stats.length > 0 && (
        <dl className="border-t border-edge px-4 py-3 text-sm">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline justify-between gap-3 py-0.5">
              <dt className="font-semibold text-ink-dim">{stat.label}</dt>
              <dd className="font-mono">
                [{stat.min}-{stat.max}]
              </dd>
            </div>
          ))}
        </dl>
      )}

      {slot && (
        <div className="border-t border-edge py-3">
          <p className="text-xs font-semibold tracking-wide text-ink-dim uppercase px-4">Additional attributes</p>

          {/* One tab per effect slot the game gives this piece at this quality:
              low qualities have a single slot, the top ones have three. */}
          {/* The tabs share the row's full width instead of wrapping. */}
          <div className="mt-2 flex gap-1 px-4" role="tablist" aria-label="Effect slots">
            {affixSlots.map((s, i) => (
              <button
                key={s.index}
                type="button"
                role="tab"
                aria-selected={s === slot}
                onClick={() => setActiveSlot(i)}
                className={`flex-1 cursor-pointer rounded border px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                  s === slot ? "border-accent text-accent" : "border-edge text-ink-dim hover:text-ink"
                }`}
              >
                Effect {s.index}
              </button>
            ))}
          </div>

          {/* Name on the left, span on the right. An effect the game config
              gives no number for has no span, so its name runs the full width. */}
          <ul className="mt-2 space-y-1 text-xs text-ink-dim">
            {slot.options.map((option) => {
              const { label, range } = affixRangeParts(option);
              return (
                <li key={option.name} className="flex items-baseline justify-between gap-3 bg-surface-2 px-4 text-sm">
                  <span>{label}</span>
                  {range && <span className="shrink-0 font-mono">{range}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}
