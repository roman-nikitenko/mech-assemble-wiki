import type { Skill } from "../../api/types";
import { StatBlock } from "../../components/StatBlock";
import { UpgradeTree } from "../../components/UpgradeTree";

export function SkillsTab({ skills }: { skills: Skill[] }) {
  if (skills.length === 0)
    return <p className="text-ink-dim">No skills recorded yet.</p>;
  return (
    <div className="space-y-6">
      {skills.map((skill) => (
        <section key={skill.id} className="rounded-xl border border-edge bg-surface/50 p-4">
          <h2 className="text-lg font-bold">{skill.name}</h2>
          {skill.description && (
            <p className="mt-1 text-sm text-ink-dim">{skill.description}</p>
          )}
          <div className="mt-3">
            <StatBlock stats={skill.baseStats} />
          </div>
          {skill.upgrades.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-dim">
                Upgrade tree
              </h3>
              <UpgradeTree roots={skill.upgrades} />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
