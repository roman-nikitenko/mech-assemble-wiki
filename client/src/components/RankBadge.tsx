import type { MechRank } from "../api/types";

export function RankBadge({ rank }: { rank: MechRank }) {
  return rank === "S" ? (
    <span className="inline-block rounded bg-accent px-2 py-0.5 text-xs font-black text-bg">
      S
    </span>
  ) : (
    <span className="inline-block rounded border border-edge bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-dim">
      Standard
    </span>
  );
}
