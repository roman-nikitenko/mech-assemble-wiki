import { Gem, RANK_GEMS } from "./Gem";

/** Rank-up preview as a list of framed gem-bands, shared by the mech Overview
    tab and the weapon detail page. `steps` is positional (index = rank); blank
    entries are skipped but keep their rank's gem color. Renders nothing when
    every entry is blank. */
export function RankUpPreview({ steps }: { steps: string[] }) {
  if (!steps.some((step) => step.trim())) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
        Rank-Up Preview
      </h2>
      <ul className="space-y-2 text-sm">
        {steps.map((step, i) =>
          step.trim() ? (
            <li
              key={i}
              className="flex items-stretch overflow-hidden rounded-lg border border-edge bg-surface-2"
            >
              <span className="flex items-center border-r border-edge bg-bg px-3">
                <Gem index={i} palette={RANK_GEMS} />
              </span>
              <span className="px-3 py-2 font-[600]">{step}</span>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
