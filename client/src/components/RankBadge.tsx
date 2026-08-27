import type { MechRank } from "../api/types";
import { STierIcon } from "./STierIcon";

export function RankBadge({ rank }: { rank: MechRank }) {
  return rank === "S" ? (
    <STierIcon size={40} className="align-middle" />
  ) : (
    <span className="inline-block rounded border border-edge bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-dim">
      Standard
    </span>
  );
}
