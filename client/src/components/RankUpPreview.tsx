import { QualityIcon } from "./QualityIcon";
import { QUALITY_TIERS } from "../api/types";

/** The quality ladder: `steps` is positional (index = tier, slot 0 = Blue …
    slot 6 = Mythic). Each non-blank line shows its tier icon + name + text.
    Renders nothing when every entry is blank. Reused on mech/weapon detail. */
export function RankUpPreview({ steps }: { steps: string[] }) {
  if (!steps.some((step) => step.trim())) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
        Rank-Up Preview
      </h2>
      <ul className="space-y-2 text-sm">
        {steps.map((step, i) =>
          step.trim() && QUALITY_TIERS[i] ? (
            <li
              key={i}
              className="flex items-stretch overflow-hidden rounded-lg border border-edge bg-surface-2"
            >
              <span className="flex items-center gap-2 [clip-path:polygon(0%_0%,100%_0%,80%_100%,0%_100%)] bg-bg px-2">
                <QualityIcon tier={QUALITY_TIERS[i]} />
              </span>
              <span className="px-3 py-2 font-[600]">{step}</span>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
