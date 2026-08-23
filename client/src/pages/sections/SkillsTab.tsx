import type { SkillNodeRow } from "../../api/types";
import { SkillNodeBranch } from "../../components/SkillNodeBranch";

export function SkillsTab({ nodes }: { nodes: SkillNodeRow[] }) {
  const visible = nodes.filter((n) => n.linkedWeaponId === null && n.linkedMechId === null);
  if (visible.length === 0) {
    return <p className="text-ink-dim">No skills recorded yet.</p>;
  }

  const baseLevels = [...new Set(visible.filter((n) => n.parentId === null).map((n) => n.appearanceLevel))].sort(
    (a, b) => a - b
  );
  return (
    <div className="space-y-6">
      {baseLevels.map((level) => (
        <section key={level}>
          <h3 className="mb-2 text-m font-bold tracking-wider">{level}/8</h3>
          <SkillNodeBranch nodes={visible} parentId={null} rootLevel={level} />
        </section>
      ))}
    </div>
  );
}
