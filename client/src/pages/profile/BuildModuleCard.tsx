import { useState, type CSSProperties } from "react";
import { imageSrc } from "../../api/client";
import type { GameType, ModuleBonusRow, ModuleQuality, ModuleSelection, ModuleSummary, QualityTier } from "../../api/types";
import { QUALITY_TIERS } from "../../api/types";
import { Dropdown } from "../../components/Dropdown";
import { QualityIcon } from "../../components/QualityIcon";
import { effectCountForTier } from "../../lib/moduleEffects";
import { qualityCardStyle } from "../../lib/moduleCardStyle";

const EMPTY: ModuleSelection = { quality: "Blue", effect1: null, effect2: null, effect3: null };

export function BuildModuleCard({
  module,
  types,
  qualities,
  selection,
  onChange,
  readOnly = false,
}: {
  module: ModuleSummary;
  types: GameType[];
  qualities: ModuleQuality[];
  selection: ModuleSelection | undefined;
  onChange?: (next: ModuleSelection) => void;
  // Read-only view (build detail page): no dropdown, no tabs — just Equipped.
  readOnly?: boolean;
}) {
  const sel = selection ?? EMPTY;
  const tier = sel.quality;
  const count = effectCountForTier(tier);
  const style = qualityCardStyle(tier);
  const [tab, setTab] = useState(0); // 0 = Equipped, 1..N = Effect n

  const tierQuality = qualities.find((q) => q.name === tier) ?? null;
  const effectRow = tierQuality ? module.effects.find((e) => e.qualityId === tierQuality.id) ?? null : null;
  const bonusesForSlot = (slot: number) => (effectRow?.bonuses ?? []).filter((b) => b.slot === slot);
  const entityOf = (b: ModuleBonusRow) => b.mech ?? b.weapon;

  function set(patch: Partial<ModuleSelection>) {
    onChange?.({ ...sel, ...patch });
  }
  function changeQuality(q: QualityTier) {
    const n = effectCountForTier(q);
    // Clear picks the new tier no longer unlocks.
    set({
      quality: q,
      effect1: n >= 1 ? sel.effect1 : null,
      effect2: n >= 2 ? sel.effect2 : null,
      effect3: n >= 3 ? sel.effect3 : null,
    });
  }
  const active = Math.min(tab, count); // clamp when count shrinks

  const equippedElement = types.find((t) => t.id === sel.effect1) ?? null;
  const equippedBonus = (slot: number, pick: string | null) =>
    pick ? bonusesForSlot(slot).find((b) => entityOf(b)?.id === pick) ?? null : null;

  const tabLabels = ["Equipped", ...Array.from({ length: count }, (_, i) => `Effect ${i + 1}`)];

  // The Equipped summary — shared by the editor's Equipped tab and the
  // read-only build-detail view.
  const equippedList = (
    <ul className="text-sm [&>li+li]:mt-[10px]">
      {equippedElement && (
        <li className=" flex items-center gap-2">
          {equippedElement.iconUrl && (
            <img src={imageSrc(equippedElement.iconUrl)} alt="" className="h-6 w-6 rounded-full object-cover" />
          )}
          <span className="font-semibold">{equippedElement.name} DMG <span className="font-bold text-accent">{tierQuality?.effect1Value ?? ""}</span></span>
        </li>
      )}
      {[2, 3].map((slot) => {
        const b = equippedBonus(slot, slot === 2 ? sel.effect2 : sel.effect3);
        if (!b) return null;
        const entity = entityOf(b);
        return (
          <li key={slot} className=" flex items-center gap-2">
            {entity?.iconUrl && (
              <img src={imageSrc(entity.iconUrl)} alt="" className="h-6 w-6 rounded-full object-cover" />
            )}
            <span className="font-semibold">{b.effectText}</span>
          </li>
        );
      })}
      {!equippedElement && !equippedBonus(2, sel.effect2) && !equippedBonus(3, sel.effect3) && (
        <li className="text-ink-dim">Nothing equipped yet.</li>
      )}
    </ul>
  );

  return (
    <div className="max-w-[300px] min-w-[300px] self-stretch justify-self-center border border-edge bg-surface">
      <div
        className={`flex flex-col gap-3  relative bg-contain bg-no-repeat bg-center p-3 after:absolute after:z-0 after:bg-no-repeat after:bg-cover after:inset-0 after:bg-(image:--bg-url)`}
        //style={style.header ? { backgroundImage: `url(${style.header})` } : undefined}
        style={{ "--bg-url": `url(${style.header})` } as CSSProperties}
      >
        <div className="flex gap-2 z-10">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center bg-cover bg-center"
            style={style.iconBorder ? { backgroundImage: `url(${style.iconBorder})` } : undefined}
          >
            {module.iconUrl && <img src={imageSrc(module.iconUrl)} alt="" className="p-1 object-contain" />}
          </div>
          <p className="text-lg font-black text-white drop-shadow">{module.name}</p>
        </div>
      </div>

      <div className="p-2">
        <div className="mb-3">
          {readOnly ? (
            <div className="flex items-center gap-2 text-sm font-semibold">
              <QualityIcon tier={tier} size={16} /> {tier}
            </div>
          ) : (
            <Dropdown
              ariaLabel={`${module.name} quality`}
              value={tier}
              onChange={(v) => changeQuality(v as QualityTier)}
              options={QUALITY_TIERS.map((t) => ({ value: t, label: t, icon: <QualityIcon tier={t} size={16} /> }))}
            />
          )}
        </div>

        <p className="mb-2 text-center text-sm font-bold text-ink-dim">Base Attributes</p>
        <dl className="space-y-1 text-sm">
          {([["HP", tierQuality?.hp], ["ATK", tierQuality?.atk], ["DEF", tierQuality?.def]] as const).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-ink-dim">{k}</dt>
              <dd className="font-bold">{v || "—"}</dd>
            </div>
          ))}
        </dl>

        {count >= 1 &&
          (readOnly ? (
            <div className="mt-3 border border-edge p-2 max-h-[210px] overflow-y-scroll">{equippedList}</div>
          ) : (
          <div className="mt-3">
            <div
              className="grid gap-1"
              role="tablist"
              style={{ gridTemplateColumns: `repeat(${tabLabels.length}, minmax(0, 1fr))` }}
            >
              {tabLabels.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active === i}
                  onClick={() => setTab(i)}
                  className={`cursor-pointer rounded-t  py-1 text-sm font-semibold ${active === i ? "bg-accent text-bg" : "bg-surface-2 text-ink-dim"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className=" border border-edge p-2 max-h-[210px] overflow-y-scroll">
              {active === 0 ? (
                equippedList
              ) : active === 1 ? (
                // Effect 1 — elements, single-select
                <ul className="[&>li+li]:mt-[10px]">
                  {types.map((t) => {
                    const on = sel.effect1 === t.id;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => set({ effect1: on ? null : t.id })}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded  text-left text-sm ${on ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-surface-2"}`}
                        >
                          {t.iconUrl && <img src={imageSrc(t.iconUrl)} alt="" className="h-6 w-6 rounded-full object-cover" />}
                          <span className="font-semibold">{t.name} DMG <span className="font-bold text-accent">{tierQuality?.effect1Value ?? ""}</span></span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                // Effect 2 / 3 — bonuses, single-select by target entity id
                (() => {
                  const slot = active; // active is 2 or 3
                  const pick = slot === 2 ? sel.effect2 : sel.effect3;
                  const rows = bonusesForSlot(slot);
                  if (rows.length === 0) return <p className="text-sm text-ink-dim">No bonuses.</p>;
                  return (
                    <ul className="[&>li+li]:mt-[10px]">
                      {rows.map((b) => {
                        const entity = entityOf(b);
                        const on = pick === entity?.id;
                        return (
                          <li key={b.id}>
                            <button
                              type="button"
                              onClick={() => set(slot === 2 ? { effect2: on ? null : entity?.id ?? null } : { effect3: on ? null : entity?.id ?? null })}
                              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-sm ${on ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-surface-2"}`}
                            >
                              {entity && "iconUrl" in entity && entity.iconUrl && (
                                <img src={imageSrc(entity.iconUrl)} alt="" className="h-6 w-6 rounded-full object-cover" />
                              )}
                              <span className="font-semibold">{b.effectText}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()
              )}
            </div>
          </div>
          ))}
      </div>
    </div>
  );
}
