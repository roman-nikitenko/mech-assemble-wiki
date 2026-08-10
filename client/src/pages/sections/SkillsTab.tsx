import type { SkillNodeRow } from "../../api/types";
import { SkillNodeBranch } from "../../components/SkillNodeBranch";

/** The mech's/weapon's skill tree (skill_nodes system, Cycle J). Linked skills
    (nodes gated on a partner) are hidden here — they only surface inside a build
    when the combo is present, never on the public detail page. */
export function SkillsTab({ nodes }: { nodes: SkillNodeRow[] }) {
  const visible = nodes.filter((n) => n.linkedWeaponId === null && n.linkedMechId === null);
  if (visible.length === 0) {
    return <p className="text-ink-dim">No skills recorded yet.</p>;
  }
  return <SkillNodeBranch nodes={visible} parentId={null} />;
}
