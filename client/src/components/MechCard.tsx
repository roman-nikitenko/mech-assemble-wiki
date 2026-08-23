import { Link } from "react-router-dom";
import type { MechSummary } from "../api/types";
import { imageSrc, srcSet, CARD_SIZES } from "../api/client";
import { TypeBadge } from "./TypeBadge";
import { RankBadge } from "./RankBadge";
import mechCardBg from "../assets/mecha_story_bg.webp"

export function MechCard({ mech, priority = false }: { mech: MechSummary; priority?: boolean }) {
  return (
    <Link
      to={`/mechs/${mech.slug ?? mech.id}`}
      className="@container block rounded-xl relative overflow-hidden border border-edge bg-surface transition hover:border-accent/60 hover:bg-surface-2 bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: `url(${mechCardBg})` }}
    >
      {mech.imageUrl ? (
        <img
          src={imageSrc(mech.imageUrl)}
          srcSet={srcSet(mech.imageUrl)}
          sizes={CARD_SIZES}
          alt={mech.name}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className=" h-62 w-full rounded-lg object-cover"
        />
      ) : (
        <div
          className="mb-3 flex h-32 w-full items-center justify-center rounded-lg bg-surface-2 text-3xl"
          aria-hidden
        >
          🤖
        </div>
      )}
      <div className="min-h-[50px] flex items-center absolute min-w-full bottom-0 left-1/2 -translate-x-1/2 z-10  justify-center py-2 gap-2 backdrop-blur-sm bg-black/10">
        {mech.rank !== 'Standard' && <RankBadge rank={mech.rank} />}
        <h2 className="font-bold text-[6cqw]">{mech.name}</h2>
        <div className="flex items-center gap-2">
          {mech.type && <TypeBadge type={mech.type} />}
        </div>
      </div>
    </Link>
  );
}
