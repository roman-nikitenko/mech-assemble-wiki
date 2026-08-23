import type { SkillNodeRow } from "../api/types";

export function SkillNodeBranch({
  nodes,
  parentId,
  rootLevel,
}: {
  nodes: SkillNodeRow[];
  parentId: string | null;
  rootLevel?: number;
}) {
  const children = nodes
    .filter((n) => n.parentId === parentId && (rootLevel === undefined || n.appearanceLevel === rootLevel))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (children.length === 0) return null;
  return (
    <div className={parentId ? "mt-2 ml-4 space-y-4 pl-4" : "space-y-4"}>
      {children.map((node) => (
        <div
          key={node.id}
          className={
            parentId
              ? "relative before:absolute before:-left-4 before:-top-2 before:bottom-0 before:w-0.5 before:bg-edge before:content-[''] last:before:bottom-auto last:before:h-8 after:absolute after:-left-4 after:top-6 after:h-0.5 after:w-4 after:bg-edge after:content-['']"
              : undefined
          }
        >
          <div
            className={`rounded-lg border p-3 ${
              node.type === "Core"
                ? "border-skill-core bg-skill-core/10"
                : node.type === "Premium"
                  ? "border-skill-premium bg-skill-premium/10"
                  : "border-thunder bg-thunder/10"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {node.name ? (
                <span className="font-semibold">{node.name}</span>
              ) : (
                <span className="font-semibold italic text-skill-core">Core skill</span>
              )}
              {node.type === "Premium" && (
                <span className="rounded bg-skill-premium/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-skill-premium">
                  PREMIUM
                </span>
              )}
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-dim">
                from Lv.{node.appearanceLevel}
              </span>
            </div>
            {node.description && <p className="mt-1 font-semibold text-sm text-ink-dim">{node.description}</p>}
          </div>
          <SkillNodeBranch nodes={nodes} parentId={node.id} />
        </div>
      ))}
    </div>
  );
}
