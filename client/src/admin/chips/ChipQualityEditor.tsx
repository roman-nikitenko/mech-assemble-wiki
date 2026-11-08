import type { ChipEffect, ChipPool, ChipPoolKind, ChipQuality } from "../../api/types";
import { CHIP_EFFECT_MODES, CHIP_POOL_KINDS } from "../../lib/chipQualities";

const fieldClass = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";
const smallBtn = "min-h-11 shrink-0 cursor-pointer rounded-lg border px-3 text-sm";

// Number inputs hand back text; an empty box counts as 0 rather than NaN.
const num = (v: string) => (v === "" ? 0 : Number(v));

export const emptyQuality = (quality: number): ChipQuality => ({
  quality,
  baseStats: [""],
  composeNext: null,
  resetCost: null,
  pools: [],
});

/** The fields for ONE quality of a chip: fixed base stats, compose count,
    reset cost and the four random-effect pools. Fully controlled — the form
    page owns the data. Blank rows are fine here; the server drops them. */
export function ChipQualityEditor({
  value,
  onChange,
}: {
  value: ChipQuality;
  onChange: (next: ChipQuality) => void;
}) {
  const set = (patch: Partial<ChipQuality>) => onChange({ ...value, ...patch });

  const poolOf = (kind: ChipPoolKind): ChipPool =>
    value.pools.find((p) => p.kind === kind) ?? { kind, chance: 0, effects: [] };
  function setPool(next: ChipPool) {
    const others = value.pools.filter((p) => p.kind !== next.kind);
    set({ pools: [...others, next] });
  }

  function setStat(i: number, text: string) {
    set({ baseStats: value.baseStats.map((s, j) => (j === i ? text : s)) });
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Base stats (fixed on every chip of this quality)</legend>
        <div className="space-y-2">
          {value.baseStats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                aria-label={`Base stat ${i + 1}`}
                value={s}
                onChange={(e) => setStat(i, e.target.value)}
                className={fieldClass}
                placeholder="e.g. HP +1,500"
              />
              <button
                type="button"
                aria-label={`Remove base stat ${i + 1}`}
                onClick={() => set({ baseStats: value.baseStats.filter((_, j) => j !== i) })}
                className={`${smallBtn} border-fire/40 text-fire hover:bg-fire/10`}
              >
                −
              </button>
            </div>
          ))}
        </div>
        {value.baseStats.length < 4 && (
          <button
            type="button"
            onClick={() => set({ baseStats: [...value.baseStats, ""] })}
            className="mt-2 min-h-11 cursor-pointer rounded-lg border border-edge px-3 text-sm hover:border-accent/60"
          >
            + Add base stat
          </button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="compose" className="mb-1 block text-sm font-semibold">
            Compose (identical chips → next quality)
          </label>
          <input
            id="compose"
            type="number"
            min={2}
            max={10}
            value={value.composeNext ?? ""}
            onChange={(e) => set({ composeNext: e.target.value === "" ? null : Number(e.target.value) })}
            className={fieldClass}
            placeholder="empty = top quality"
          />
        </div>
        <div>
          <label htmlFor="reset-cost" className="mb-1 block text-sm font-semibold">
            Reset cost
          </label>
          <input
            id="reset-cost"
            value={value.resetCost ?? ""}
            onChange={(e) => set({ resetCost: e.target.value === "" ? null : e.target.value })}
            className={fieldClass}
            placeholder="e.g. Chip Calibrator ×2"
          />
        </div>
      </div>

      {CHIP_POOL_KINDS.map((kind) => {
        const pool = poolOf(kind);
        const setEffect = (i: number, patch: Partial<ChipEffect>) =>
          setPool({ ...pool, effects: pool.effects.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
        return (
          <fieldset key={kind} className="rounded-lg border border-edge p-3">
            <legend className="px-1 text-sm font-semibold">{kind}</legend>
            <div className="mb-2 flex items-center gap-2">
              <label htmlFor={`pool-${kind}`} className="text-sm text-ink-dim">
                Pool chance %
              </label>
              <input
                id={`pool-${kind}`}
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={pool.chance}
                onChange={(e) => setPool({ ...pool, chance: num(e.target.value) })}
                className={`${fieldClass} w-28`}
              />
            </div>
            <div className="space-y-2">
              {pool.effects.map((e, i) => (
                <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <input
                    aria-label={`${kind} effect ${i + 1} text`}
                    value={e.text}
                    onChange={(ev) => setEffect(i, { text: ev.target.value })}
                    className={`${fieldClass} flex-1`}
                    placeholder="e.g. Ice DMG Boost +1%"
                  />
                  <select
                    aria-label={`${kind} effect ${i + 1} mode`}
                    value={e.mode}
                    onChange={(ev) => setEffect(i, { mode: ev.target.value as ChipEffect["mode"] })}
                    className={`${fieldClass} sm:w-36`}
                  >
                    {CHIP_EFFECT_MODES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    aria-label={`${kind} effect ${i + 1} chance`}
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={e.chance}
                    onChange={(ev) => setEffect(i, { chance: num(ev.target.value) })}
                    className={`${fieldClass} w-24`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${kind} effect ${i + 1}`}
                    onClick={() => setPool({ ...pool, effects: pool.effects.filter((_, j) => j !== i) })}
                    className={`${smallBtn} border-fire/40 text-fire hover:bg-fire/10`}
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPool({ ...pool, effects: [...pool.effects, { text: "", mode: "All modes", chance: 0 }] })}
              className="mt-2 min-h-11 cursor-pointer rounded-lg border border-edge px-3 text-sm hover:border-accent/60"
            >
              + Add effect
            </button>
          </fieldset>
        );
      })}
    </div>
  );
}
