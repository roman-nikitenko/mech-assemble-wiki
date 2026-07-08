import type { MechDetail } from "../../api/types";

export function OverviewTab({ mech }: { mech: MechDetail }) {
  return (
    <div className="space-y-5">
      {mech.traits.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Traits
          </h2>
          <div className="flex flex-wrap gap-2">
            {mech.traits.map(({ id, trait }) => (
              <span
                key={id}
                className="rounded-full border border-edge bg-surface px-3 py-1 text-sm font-semibold"
                // trait colors come from the DB, so they can't be Tailwind
                // classes — inline style is the right tool here. "66" = 40% alpha.
                style={
                  trait.color
                    ? { color: trait.color, borderColor: `${trait.color}66` }
                    : undefined
                }
              >
                {trait.name}
              </span>
            ))}
          </div>
        </section>
      )}
      {mech.accessory && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Accessory
          </h2>
          <div className="rounded-xl border border-edge bg-surface p-4">
            <p className="font-semibold">{mech.accessory.name}</p>
            {mech.accessory.description && (
              <p className="mt-1 text-sm text-ink-dim">{mech.accessory.description}</p>
            )}
          </div>
        </section>
      )}
      {mech.lore && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Lore
          </h2>
          <p className="italic leading-relaxed text-ink-dim">{mech.lore}</p>
        </section>
      )}
    </div>
  );
}
