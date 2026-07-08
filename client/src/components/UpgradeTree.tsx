import type { UpgradeNode } from "../api/types";

/** One node card. Recursion note: this component renders ITSELF for each
    child — that's all a tree renderer is. Depth is whatever the data has;
    the API guarantees children[] is already assembled. */
function UpgradeNodeCard({ node }: { node: UpgradeNode }) {
  return (
    <div>
      <div
        className={`rounded-lg border p-3 ${
          node.isEvolution
            ? "border-energy bg-energy/10 shadow-lg shadow-energy/20" // evolution glow
            : "border-edge bg-surface"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{node.name}</span>
          {node.isEvolution && (
            <span className="rounded bg-energy/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-energy">
              EVOLVE
            </span>
          )}
          {node.unlockReq && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-dim">
              unlock {node.unlockReq}
            </span>
          )}
        </div>
        {node.description && (
          <p className="mt-1 text-sm text-ink-dim">{node.description}</p>
        )}
      </div>

      {node.children.length > 0 && (
        // indented children with a connector line (the left border)
        <div className="mt-2 ml-4 space-y-2 border-l-2 border-edge pl-4">
          {node.children.map((child) => (
            <UpgradeNodeCard key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function UpgradeTree({ roots }: { roots: UpgradeNode[] }) {
  return (
    <div className="space-y-2">
      {roots.map((root) => (
        <UpgradeNodeCard key={root.id} node={root} />
      ))}
    </div>
  );
}
