import type { SkillNodeRow } from "../../api/types";
import { SkillNodeBranch } from "../../components/SkillNodeBranch";

/** The mech's skill tree (skill_nodes system, Cycle J). The legacy
    mech_skills/skill_upgrades render lived here until it went dormant. */
export function SkillsTab({ nodes }: { nodes: SkillNodeRow[] }) {
  if (nodes.length === 0) {
    return <p className="text-ink-dim">No skills recorded yet.</p>;
  }
  return <SkillNodeBranch nodes={nodes} parentId={null} />;
}
