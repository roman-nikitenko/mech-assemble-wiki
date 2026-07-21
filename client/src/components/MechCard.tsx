import { Link } from "react-router-dom";
import type { MechSummary } from "../api/types";
import { imageSrc } from "../api/client";
import { TypeBadge } from "./TypeBadge";
import { RankBadge } from "./RankBadge";

export function MechCard({ mech }: { mech: MechSummary }) {
  return (
    <Link
      to={`/mechs/${mech.id}`}
      className="block rounded-xl border border-edge bg-surface p-4 transition hover:border-accent/60 hover:bg-surface-2"
    >
      {mech.imageUrl ? (
        <img
          src={imageSrc(mech.imageUrl)}
          alt={mech.name}
          className="mb-3 h-42 w-full rounded-lg object-cover"
        />
      ) : (
        // themed placeholder keeps the grid rhythm when there's no art yet
        <div
          className="mb-3 flex h-32 w-full items-center justify-center rounded-lg bg-surface-2 text-3xl"
          aria-hidden
        >
          🤖
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-bold">{mech.name}</h2>
          {mech.epithet && <p className="text-sm text-ink-dim">{mech.epithet}</p>}
        </div>
        <RankBadge rank={mech.rank} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        {mech.type && <TypeBadge type={mech.type} />}
      </div>
    </Link>
  );
}
