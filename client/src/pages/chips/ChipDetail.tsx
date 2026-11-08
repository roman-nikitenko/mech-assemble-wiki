import type { Chip, ChipQuality } from "../../api/types";
import { chipIcon } from "../../lib/chipArt";
import {
  CHIP_QUALITIES,
  MODE_STYLE,
  chipQualityInfo,
  chipQualityTextStyle,
  nextChipQuality,
  overallChance,
} from "../../lib/chipQualities";

/** The detail card for one chip at one quality: fixed stats on the left,
    the random-effect pools on the right (the reference page's layout). */
export function ChipDetail({ chip, quality }: { chip: Chip; quality: number }) {
  const info = chipQualityInfo(quality);
  const data: ChipQuality | undefined = chip.qualities.find((q) => q.quality === quality);

  if (!data || !info) {
    return (
      <div className="rounded-xl border border-edge bg-surface p-6 text-center text-ink-dim">
        No data yet for {info?.name ?? "this quality"}.
      </div>
    );
  }

  const next = nextChipQuality(quality);
  const icon = chipIcon(chip.category, quality);

  return (
    <div className="grid gap-5 rounded-xl border border-edge bg-surface p-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <div className="grid content-start justify-items-center gap-3 text-center">
        {icon && <img src={icon} alt="" className="h-[150px] w-[150px] object-contain" />}
        <div className="text-xl font-bold" style={chipQualityTextStyle(quality)}>
          {info.name}
        </div>
        <div className="text-sm">{chip.name}</div>
        <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-left text-sm">
          <dt className="text-ink-dim">Base stats</dt>
          <dd>
            {data.baseStats.length === 0
              ? "—"
              : data.baseStats.map((s) => (
                  <div key={s}>{s}</div>
                ))}
          </dd>
          <dt className="text-ink-dim">Compose</dt>
          <dd>
            {data.composeNext && next ? `${data.composeNext} identical → 1 ${next.name}` : "Max quality"}
          </dd>
          <dt className="text-ink-dim">Reset cost</dt>
          <dd>{data.resetCost ?? "—"}</dd>
        </dl>
      </div>

      <div className="grid min-w-0 content-start gap-3.5">
        <h3 className="text-base font-semibold">Random effect pools</h3>
        {data.pools.length === 0 && <p className="text-sm text-ink-dim">This chip has no random effects.</p>}
        {data.pools.map((pool) => (
          <section key={pool.kind} className="overflow-hidden rounded-lg border border-edge">
            <header className="flex items-center justify-between gap-3 bg-bg/40 px-3 py-2 text-sm font-semibold">
              <span>{pool.kind}</span>
              <span className="flex items-center gap-2.5">
                <span className="h-1.5 w-[120px] shrink-0 overflow-hidden rounded bg-edge">
                  <i className="block h-full bg-accent" style={{ width: `${Math.min(100, pool.chance)}%` }} />
                </span>
                <span className="min-w-[3.5rem] text-right font-mono text-xs text-ink-dim">{pool.chance}%</span>
              </span>
            </header>
            {pool.effects.map((e) => (
              <div
                key={e.text}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 border-t border-edge px-3 py-2 text-sm first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <span className={pool.kind === "Overclock skill" ? "text-[#f6c21c]" : undefined}>{e.text}</span>
                <span className="min-w-[3.5rem] text-right font-mono text-xs tabular-nums text-ink-dim">
                  {overallChance(pool.chance, e.chance)}%
                </span>
                <span
                  className={`col-span-2 w-fit whitespace-nowrap rounded-full border border-current px-2 font-mono text-[11px] sm:col-span-1 ${MODE_STYLE[e.mode].className}`}
                >
                  {MODE_STYLE[e.mode].label}
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

// Re-exported so tests and the browser agree on the quality list.
export { CHIP_QUALITIES };
