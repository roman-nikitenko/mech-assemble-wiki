import type { Weapon } from "../../api/types";
import type { SkillNodeRow } from "../../api/types";
import { imageSrc } from "../../api/client";
import { StatBlock } from "../../components/StatBlock";
import { RankBadge } from "../../components/RankBadge";
import { HelperCard } from "../../components/HelperCard";

export function WeaponTab({ weapon }: { weapon: Weapon }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-accent/30 bg-surface/50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-accent">{weapon.name}</h2>
          <RankBadge rank={weapon.tier} />
        </div>
        {weapon.description && (
          <p className="mt-1 text-sm text-ink-dim">{weapon.description}</p>
        )}
        <div className="mt-3">
          <StatBlock stats={weapon.baseStats} />
        </div>
      </section>
      {weapon.skillNodes.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Skills
          </h3>
          <SkillNodeBranch nodes={weapon.skillNodes} parentId={null} />
        </section>
      )}
      {weapon.weaponSkins.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Skins
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {weapon.weaponSkins.map((skin) => (
              <div key={skin.id} className="rounded-xl border border-edge bg-surface p-4">
                {skin.imageUrl && (
                  <img
                    src={imageSrc(skin.imageUrl)}
                    alt={skin.name}
                    className="mb-3 h-28 w-full rounded-lg object-cover"
                  />
                )}
                <p className="font-semibold">{skin.name}</p>
                {skin.bonuses.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {skin.bonuses.map((bonus, i) => (
                      <li key={i} className="text-sm text-ink-dim">
                        <span className="text-accent">{"★".repeat(i + 1)}</span> {bonus}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {weapon.helpers.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
            Weapon helpers
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {weapon.helpers.map((h) => (
              <HelperCard key={h.id} helper={h} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Recursive skill-tree renderer: groups the flat nodes by parent, walks
    down. Premium = gold accents; Core = accent border + italic, no name. */
function SkillNodeBranch({ nodes, parentId }: { nodes: SkillNodeRow[]; parentId: string | null }) {
  const children = nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (children.length === 0) return null;
  return (
    <div className={parentId ? "mt-2 ml-4 space-y-2 border-l-2 border-edge pl-4" : "space-y-2"}>
      {children.map((node) => (
        <div key={node.id}>
          <div
            className={`rounded-lg border p-3 ${
              node.type === "Core"
                ? "border-accent bg-accent/10"
                : node.type === "Premium"
                  ? "border-accent/50 bg-surface"
                  : "border-edge bg-surface"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {node.name ? (
                <span className="font-semibold">{node.name}</span>
              ) : (
                <span className="font-semibold italic text-accent">Core skill</span>
              )}
              {node.type === "Premium" && (
                <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-accent">
                  PREMIUM
                </span>
              )}
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-dim">
                from Lv.{node.appearanceLevel}
              </span>
            </div>
            {node.description && <p className="mt-1 text-sm text-ink-dim">{node.description}</p>}
          </div>
          <SkillNodeBranch nodes={nodes} parentId={node.id} />
        </div>
      ))}
    </div>
  );
}
