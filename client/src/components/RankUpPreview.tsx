import { QualityIcon } from "./QualityIcon";
import { QUALITY_TIERS } from "../api/types";
import type { QualityTier } from "../api/types";

export const AIRCRAFT_RANK_TIERS: QualityTier[] = QUALITY_TIERS.slice(2);
/** Positional rank-up rows, one per tier in `tiers`. Pass `quality` to dim the
    rungs the subject hasn't reached yet — the same "locked" treatment DroneCard
    gives level-up bonuses above the equipped gem. */
export function RankUpPreview({
  steps,
  tiers = QUALITY_TIERS,
  quality,
}: {
  steps: string[];
  tiers?: QualityTier[];
  quality?: QualityTier;
}) {
  if (!steps.some((step) => step.trim())) return null;
  // Index of the highest rung reached. With no quality (the public mech/weapon
  // pages) nothing dims; a quality that isn't on this ladder also falls back to
  // "all reached", so bad data can't grey out the whole panel.
  const at = quality === undefined ? -1 : tiers.indexOf(quality);
  const reached = at === -1 ? tiers.length - 1 : at;
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
        Rank-Up Preview
      </h2>
      <ul className="space-y-2 text-sm">
        {steps.map((step, i) =>
          step.trim() && tiers[i] ? (
            <li
              key={i}
              className={`flex items-stretch overflow-hidden border border-edge bg-surface-2 ${
                i > reached ? "opacity-40" : ""
              }`}
            >
              <span className="flex items-center gap-2 [clip-path:polygon(0%_0%,100%_0%,80%_100%,0%_100%)] bg-bg px-2">
                <QualityIcon tier={tiers[i]} />
              </span>
              <span className="px-3 py-2 font-[600]">{step}</span>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
