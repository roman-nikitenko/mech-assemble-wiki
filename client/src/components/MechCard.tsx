import { Link } from "react-router-dom";
import type { MechSummary } from "../api/types";
import { TypeBadge } from "./TypeBadge";
import { RankBadge } from "./RankBadge";

export function MechCard({ mech }: { mech: MechSummary }) {
  return (
    <Link
      to={`/mechs/${mech.id}`}
      className="block rounded-xl border border-edge bg-surface p-4 transition hover:border-accent/60 hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-bold">{mech.name}</h2>
          {mech.epithet && <p className="text-sm text-ink-dim">{mech.epithet}</p>}
        </div>
        <RankBadge rank={mech.rank} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <TypeBadge type={mech.type} />
        {mech.quality && <span className="text-xs text-ink-dim">{mech.quality}</span>}
      </div>
    </Link>
  );
}
