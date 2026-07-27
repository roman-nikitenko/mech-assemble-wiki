import { Link } from "react-router-dom";
import type { MechSummary } from "../api/types";
import { imageSrc, srcSet, CARD_SIZES } from "../api/client";
import { TypeBadge } from "./TypeBadge";
import { RankBadge } from "./RankBadge";

// `priority` marks the card whose image is the page's LCP (Largest Contentful
// Paint) — typically the first card in the grid. That image must NOT be
// lazy-loaded: instead it loads eagerly with fetchPriority="high" so the
// browser fetches it right away. Every other card stays lazy (see BrowsePage).
export function MechCard({ mech, priority = false }: { mech: MechSummary; priority?: boolean }) {
  return (
    <Link
      to={`/mechs/${mech.id}`}
      className="block rounded-xl border border-edge bg-surface p-4 transition hover:border-accent/60 hover:bg-surface-2"
    >
      {mech.imageUrl ? (
        <img
          src={imageSrc(mech.imageUrl)}
          srcSet={srcSet(mech.imageUrl)}
          sizes={CARD_SIZES}
          alt={mech.name}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="mb-3 h-52 w-full rounded-lg object-cover"
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
