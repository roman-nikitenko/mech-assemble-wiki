import type { SkillNodeRow } from "../api/types";

/** Recursive skill-tree renderer: groups the flat nodes by parent, walks
    down. Premium = gold accents; Core = accent border + italic, no name. */
export function SkillNodeBranch({ nodes, parentId }: { nodes: SkillNodeRow[]; parentId: string | null }) {
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
