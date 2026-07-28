import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { imageSrc, srcSet } from "../../api/client";
import { Gem, RANK_GEMS } from "../../components/Gem";
import type { MechDetail } from "../../api/types";

/** One linked-kit row: icon on the left (clickable when `to` is given) and the
    item's bonus to its right. `children` carries any extra detail (e.g. the
    accessory's stat attributes). */
function LinkedRow({
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
    <div className="flex items-start gap-3 rounded-xl border border-edge bg-surface p-3">
      {to ? (
        <Link to={to} title={name} className="shrink-0 transition hover:brightness-110">
          {icon}
        </Link>
      ) : (
        <span className="shrink-0">{icon}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{name}</p>
        {bonus && <p className="text-sm text-ink-dim">{bonus}</p>}
      </div>
    </div>
  );
}

export function OverviewTab({ mech }: { mech: MechDetail }) {
  return (
    <div className="space-y-5">
      {(mech.weapon || mech.accessory) && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Linked Weapon
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {mech.weapon && (
              <LinkedRow
                to={`/weapons/${mech.weapon.id}`}
                iconUrl={mech.weapon.iconUrl}
                name={mech.weapon.name}
                bonus={mech.weapon.description}
              />
            )}
            {mech.accessory && (
              // No accessory detail page exists yet, so this icon is not a link.
              <LinkedRow
                iconUrl={mech.accessory.iconUrl}
                name={mech.accessory.name}
                bonus={mech.accessory.exclusiveEffect}
              >
                {mech.accessory.attributes.length > 0 && (
                  <dl className="mt-2 grid grid-cols-2 gap-2">
                    {mech.accessory.attributes.map((attr) => (
                      <div
                        key={attr.name}
                        className="flex justify-between gap-2 rounded bg-surface-2 px-2 py-1 text-sm"
                      >
                        <dt className="text-ink-dim">{attr.name}</dt>
                        <dd className="font-semibold">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </LinkedRow>
            )}
          </div>
        </section>
      )}
      {mech.traits.length > 0 && (
        <section>
          <h2 className="mb-2  text-sm font-bold uppercase tracking-wider text-ink-dim">
            Mech Traits
          </h2>
          <div className="grid max-w-[600px] grid-cols-2 gap-2">
            {mech.traits.map(({ id, trait }) => (
              <span
                key={id}
                className=" text-center border border-edge bg-surface px-3 py-1 text-sm font-semibold"
              >
                {trait.name}
              </span>
            ))}
          </div>
        </section>
      )}
      {mech.rankUpPreview.some((step) => step.trim()) && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Rank-Up Preview
          </h2>
          {/* Positional list (index = rank): each non-blank step is a framed
              band with its rank gem, styled like the pilot bonus rows. */}
          <ul className="space-y-2 text-sm">
            {mech.rankUpPreview.map((step, i) =>
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
      )}
    </div>
  );
}
