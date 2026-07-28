import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { imageSrc, srcSet } from "../api/client";

/** One linked-entity row: icon on the left (clickable when `to` is given) and
    the item's name + bonus to its right. `children` carries any extra detail
    (e.g. an accessory's stat attributes). Shared by the mech Overview (linked
    weapon/accessory) and the weapon detail page (linked mech/pilot). */
export function LinkedRow({
  to,
  iconUrl,
  name,
  bonus,
  children,
}: {
  to?: string;
  iconUrl: string | null;
  name: string;
  bonus: string | null;
  children?: ReactNode;
}) {
  const icon = iconUrl ? (
    <img
      src={imageSrc(iconUrl)}
      srcSet={srcSet(iconUrl)}
      sizes="48px"
      alt={name}
      loading="lazy"
      className="h-16 w-16 rounded-lg border border-edge object-cover"
    />
  ) : (
    <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-edge text-xs text-accent">
      {name.slice(0, 2)}
    </span>
  );

  
  

  return (
    <div className="flex items-start gap-3">
      {to ? (
        <Link to={to} title={name} className="shrink-0 transition hover:brightness-110">
          {icon}
        </Link>
      ) : (
        <span className="shrink-0 rounded-full overflow-hidden">{icon}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{name}</p>
        {bonus && <p className="text-sm text-ink-dim font-bold">{bonus}</p>}
      </div>
    </div>
  );
}
