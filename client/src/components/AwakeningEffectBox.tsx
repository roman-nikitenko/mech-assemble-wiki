import type { AwakeningLevel } from "../api/types";
import { imageSrc } from "../api/client";
import { coreStatIcon, sumCoreAttrs } from "../profile/awakeningSteps";
import { AwakeningIcon } from "./AwakeningIcon";

/** What a build's awakening step has unlocked: every reached core node's stats
    summed into one row, then each special effect beside the mech's portrait.
    Read-only — the build editor and the build page both render it. */
export function AwakeningEffectBox({
  cores,
  mechIconUrl,
}: {
  /** The reached cores — see reachedCores(). Empty = nothing unlocked yet. */
  cores: AwakeningLevel[];
  mechIconUrl: string | null;
}) {
  const stats = sumCoreAttrs(cores);
  const effects = cores.filter((c) => c.coreSkill);

  return (
    <section
      aria-label="Awakening Effect"
      className="overflow-hidden rounded-lg border-2 border-amber-400/70 bg-surface"
    >
      <h3 className="bg-amber-500/90 py-1.5 text-center font-nasalization text-lg tracking-wide text-bg">
        Awakening Effect
      </h3>

      {cores.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-dim">No awakening effects yet.</p>
      ) : (
        <div className="space-y-3 p-3">
          {stats.length > 0 && (
            <ul className="flex flex-wrap justify-around gap-x-6 gap-y-2">
              {stats.map((s, i) => {
                const icon = coreStatIcon(s.name);
                return (
                  <li key={i} className="flex items-center gap-1.5 text-lg font-black text-emerald-400">
                    {icon ? (
                      <>
                        <AwakeningIcon icon={icon} size={24} />
                        {/* The sprite carries the stat visually; say it for
                            screen readers too. */}
                        <span className="sr-only">{s.name}</span>
                        <span>{s.text}</span>
                      </>
                    ) : (
                      // No sprite: name the stat in text rather than show a
                      // bare "+3%".
                      <span>{s.name ? `${s.name} ${s.text}` : s.text}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {effects.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded bg-surface-2 p-2">
              {mechIconUrl && (
                <img src={imageSrc(mechIconUrl)} alt="" className="h-12 w-12 shrink-0 object-contain" />
              )}
              <div className="min-w-0">
                <p className="font-bold">{c.coreSkill}</p>
                {c.coreInfo && <p className="text-sm text-ink-dim">{c.coreInfo}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
