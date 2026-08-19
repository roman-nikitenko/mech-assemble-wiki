import { useState } from "react";
import { imageSrc } from "../api/client";
import type { GameType, ModuleQuality, ModuleSummary, QualityTier } from "../api/types";
import { effectCountForTier } from "../lib/moduleEffects";
import { qualityCardStyle } from "../lib/moduleCardStyle";

export function ModuleCard({
  module,
  tier,
  quality,
  types,
}: {
  module: ModuleSummary;
  tier: QualityTier;
  quality: ModuleQuality | null;
  types: GameType[];
}) {
  const count = effectCountForTier(tier);
  const style = qualityCardStyle(tier);
  const [tab, setTab] = useState(1);
  const active = Math.min(tab, Math.max(1, count));

  // The module's per-quality effect row at the selected tier (bonuses live per
  // module × quality); matched via the quality catalog id.
  const effectRow = quality ? module.effects.find((e) => e.qualityId === quality.id) ?? null : null;
  const bonusesForSlot = (slot: number) => (effectRow?.bonuses ?? []).filter((b) => b.slot === slot);

  return (
    <div className="overflow-hidden max-w-[300px] min-w-[300px] place-self-center border border-edge bg-surface">
      <div
        className="flex flex-col  gap-3  h-[160px] bg-contain bg-no-repeat bg-center p-3"
        style={style.header ? { backgroundImage: `url(${style.header})` } : undefined}
      >
        <h3 className="font-black font-2xl text-white  [-webkit-text-stroke:0.3px_#000000]">Aiming calibration system</h3>
        <div className="flex gap-2">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center  bg-cover bg-center"
            style={style.iconBorder ? { backgroundImage: `url(${style.iconBorder})` } : undefined}
          >

            {module.iconUrl && (
              <img src={imageSrc(module.iconUrl)} alt="" className="p-1 object-contain" />
            )}
          </div>
          <p className="text-lg font-black text-white drop-shadow">{module.name}</p>
        </div>
      </div>

      <div className="p-3">
        <p className="mb-2 text-center text-sm font-bold text-ink-dim">Base Attributes</p>
        <dl className="space-y-1 text-sm">
          {([["HP", quality?.hp], ["ATK", quality?.atk], ["DEF", quality?.def]] as const).map(
            ([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-ink-dim">{k}</dt>
                <dd className="font-bold">{v || "—"}</dd>
              </div>
            )
          )}
        </dl>

        {count >= 1 && (
          <div className="mt-3">
            <div className="grid grid-cols-3 gap-1" role="tablist">
              {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={active === n}
                  onClick={() => setTab(n)}
                  className={`cursor-pointer rounded-t  px-3 py-1 text-sm font-semibold ${active === n ? "bg-accent text-bg" : "bg-surface-2 text-ink-dim"
                    }`}
                >
                  Effect {n}
                </button>
              ))}
            </div>
            <div className="rounded-b rounded-tr border border-edge p-2 max-h-[210px] overflow-y-scroll">
              {active === 1 ? (
                <ul className="space-y-1">
                  {types.map((t) => (
                    <li key={t.id} className="flex items-center mb-2 gap-2 text-sm">
                      {t.iconUrl && (
                        <img src={imageSrc(t.iconUrl)} alt="" className="h-5 w-5 rounded-full object-cover" />
                      )}
                      <span>
                        {t.name} DMG{" "}
                        <span className="font-bold text-accent">{quality?.effect1Value ?? ""}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : bonusesForSlot(active).length === 0 ? (
                <p className="text-sm text-ink-dim">No bonuses.</p>
              ) : (
                <ul className="space-y-1">
                  {bonusesForSlot(active).map((b) => {
                    const entity = b.mech ?? b.weapon;
                    return (
                      <li key={b.id} className="flex items-center mb-2 gap-2 text-sm">
                        {entity?.iconUrl && (
                          <img src={imageSrc(entity.iconUrl)} alt="" className="h-5 w-5 rounded-full object-cover" />
                        )}
                        <span className="font-semibold">{entity?.name}</span>
                        <span className="text-ink-dim">{b.effectText}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
