import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { imageSrc, useCreateModule, useMechs, useModule, useModuleQualities, useTypes, useUpdateModule, useUpsertModuleQuality, useWeapons } from "../../api/client";
import type { ModuleDetail, ModuleInput, ModuleTargetKind, QualityTier } from "../../api/types";
import { QUALITY_TIERS } from "../../api/types";
import { ButtonGroup } from "../../components/ButtonGroup";
import { Dropdown } from "../../components/Dropdown";
import { QualityIcon } from "../../components/QualityIcon";
import { ImageUploadField } from "../ImageUploadField";
import { effectCountForTier } from "../../lib/moduleEffects";

const TARGET_KINDS: ModuleTargetKind[] = ["Weapon", "Mech"];

// One Effect 2/3 bonus row being edited. `entityId` holds whichever of
// mechId/weaponId applies — decided at submit time by the module's targetKind
// (a module targets weapons XOR mechs). Bonuses are per-module (module-level,
// not per-quality) — the same list applies at every quality that unlocks the slot.
type BonusDraft = { slot: 2 | 3; entityId: string; effectText: string };

const EMPTY: ModuleInput = {
  name: "",
  iconUrl: null,
  effect2Target: "Weapon",
  effect3Target: "Weapon",
  bonuses: [],
};

/** Rebuilds the flat bonus drafts from a loaded module's bonus rows (edit-mode
    prefill). Bonuses are module-level now, so no tier/quality mapping is needed. */
function bonusesFromDetail(detail: ModuleDetail): BonusDraft[] {
  return detail.bonuses.map((b) => ({
    slot: b.slot as 2 | 3,
    entityId: b.mech?.id ?? b.weapon?.id ?? "",
    effectText: b.effectText,
  }));
}

/** One form for BOTH /admin/modules/new and /admin/modules/:id/edit —
    mirrors MechFormPage's create+edit-in-one-component pattern via useParams.
    Base attributes (HP/ATK/DEF) and Effect 1 (Elemental DMG %) are per-quality
    (shared across all modules at that tier); Effect 2/3 bonuses are per-module
    (module-level, shown regardless of the selected quality). */
export function ModuleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const existing = useModule(id ?? ""); // only meaningful in edit mode
  const createModule = useCreateModule();
  const updateModule = useUpdateModule(id ?? "");
  const qualities = useModuleQualities();
  const upsertQuality = useUpsertModuleQuality();
  const types = useTypes();
  const mechs = useMechs({});
  const weapons = useWeapons();

  const [form, setForm] = useState<ModuleInput>(EMPTY);
  // Effect 2/3 bonuses — module-level, flat list (not keyed by quality tier).
  const [bonuses, setBonuses] = useState<BonusDraft[]>([]);
  // Which quality tier's attributes to edit — the same fixed Blue→Mythic ladder
  // weapons/mechs use. Base attributes + Effect 1 live on the quality (shared
  // across all modules), matched to the tier by name.
  const [tier, setTier] = useState<QualityTier>(QUALITY_TIERS[0]);
  // In-progress edits for the selected tier, keyed by tier name. A tier absent
  // here shows the saved catalog value; present here shows the edit.
  const [edits, setEdits] = useState<
    Record<string, { hp: string; atk: string; def: string; effect1Value: string }>
  >({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const tierQuality = qualities.data?.find((q) => q.name === tier) ?? null;
  const effectCount = effectCountForTier(tier);
  // Field values: an in-progress edit if any, else the saved catalog value,
  // else blank (a tier you haven't set yet → blank/0).
  const current = edits[tier] ?? {
    hp: tierQuality?.hp ?? "",
    atk: tierQuality?.atk ?? "",
    def: tierQuality?.def ?? "",
    effect1Value: tierQuality?.effect1Value ?? "",
  };

  function setField(field: "hp" | "atk" | "def" | "effect1Value", value: string) {
    setEdits((e) => ({ ...e, [tier]: { ...current, [field]: value } }));
  }

  // Effect 2 and Effect 3 each pick weapons OR mechs independently.
  const targetForSlot = (slot: 2 | 3) => (slot === 2 ? form.effect2Target : form.effect3Target);
  const labelForTarget = (t: ModuleTargetKind) => (t === "Weapon" ? "weapon" : "mech");
  function entityOptionsFor(t: ModuleTargetKind) {
    return t === "Weapon"
      ? (weapons.data ?? []).map((w) => ({
          value: w.id,
          label: w.name,
          icon: w.iconUrl ? (
            <img src={imageSrc(w.iconUrl)} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : undefined,
        }))
      : (mechs.data ?? []).map((m) => ({
          value: m.id,
          label: m.name,
          icon: m.imageUrl ? (
            <img src={imageSrc(m.imageUrl)} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : undefined,
        }));
  }
  // Changing an effect's target invalidates that slot's picked entities (a
  // weapon id isn't a mech id), so clear the slot's bonuses.
  function setSlotTarget(slot: 2 | 3, value: ModuleTargetKind) {
    set(slot === 2 ? "effect2Target" : "effect3Target", value);
    setBonuses((b) => b.filter((x) => x.slot !== slot));
  }

  function addBonus(slot: 2 | 3) {
    setBonuses((b) => [...b, { slot, entityId: "", effectText: "" }]);
  }
  function patchBonus(index: number, patch: Partial<BonusDraft>) {
    setBonuses((b) => b.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeBonus(index: number) {
    setBonuses((b) => b.filter((_, i) => i !== index));
  }

  // Effect 2 (slot 2) and Effect 3 (slot 3) share this module-level bonus list —
  // a target dropdown (mech/weapon per target kind) + effect text per row.
  function bonusSection(slot: 2 | 3) {
    const target = targetForSlot(slot);
    const targetLabel = labelForTarget(target);
    const options = entityOptionsFor(target);
    return (
      <div className="mt-4 border-t border-edge pt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Effect {slot} · Bonuses</p>
          <div className="w-44">
            <ButtonGroup
              ariaLabel={`Effect ${slot} target`}
              labelPrefix={`Effect ${slot}`}
              options={TARGET_KINDS.map((k) => ({ value: k, label: k }))}
              value={target}
              onChange={(v) => setSlotTarget(slot, v as ModuleTargetKind)}
            />
          </div>
        </div>
        <p className="mb-2 text-xs text-ink-dim">Each bonus targets a {targetLabel}.</p>
        {bonuses.map((b, i) =>
          b.slot === slot ? (
            <div key={i} className="mb-2 flex items-center gap-2">
              <div className="flex-1">
                <Dropdown
                  ariaLabel={`Effect ${slot} bonus ${i + 1} ${targetLabel}`}
                  searchable
                  value={b.entityId}
                  onChange={(v) => patchBonus(i, { entityId: v })}
                  placeholder={`Select a ${targetLabel}…`}
                  options={options}
                />
              </div>
              <input
                aria-label={`Effect ${slot} bonus ${i + 1} text`}
                value={b.effectText}
                onChange={(e) => patchBonus(i, { effectText: e.target.value })}
                className={`${fieldCls} flex-1`}
                placeholder="e.g. ATK +10%"
              />
              <button
                type="button"
                aria-label={`Remove Effect ${slot} bonus ${i + 1}`}
                onClick={() => removeBonus(i)}
                className="shrink-0 rounded border border-fire/40 px-2 py-1 text-xs text-fire hover:bg-fire/10"
              >
                ✕
              </button>
            </div>
          ) : null
        )}
        <button
          type="button"
          onClick={() => addBonus(slot)}
          className="mt-1 min-h-11 cursor-pointer rounded-lg border border-edge px-4 text-sm hover:border-accent/60"
        >
          + Add bonus
        </button>
      </div>
    );
  }

  // Prefill once the existing module arrives (edit mode only). Bonuses are
  // module-level now, so no quality catalog lookup is needed for the mapping.
  useEffect(() => {
    if (isEdit && existing.data) {
      const m = existing.data;
      setForm({
        name: m.name,
        iconUrl: m.iconUrl,
        effect2Target: m.effect2Target,
        effect3Target: m.effect3Target,
        bonuses: [],
      });
      setBonuses(bonusesFromDetail(m));
    }
  }, [isEdit, existing.data]);

  const mutation = isEdit ? updateModule : createModule;

  function set<K extends keyof ModuleInput>(key: K, value: ModuleInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    try {
      // Persist any tier whose fields were edited. HP/ATK/DEF are required by
      // the catalog; the values are shared across every module at that tier.
      for (const [t, d] of Object.entries(edits)) {
        if (!d.hp.trim() || !d.atk.trim() || !d.def.trim()) continue;
        const count = effectCountForTier(t as QualityTier);
        const effect1Value = count >= 1 ? d.effect1Value.trim() || null : null;
        const row = qualities.data?.find((q) => q.name === t);
        const unchanged =
          row &&
          row.hp === d.hp.trim() &&
          row.atk === d.atk.trim() &&
          row.def === d.def.trim() &&
          (row.effect1Value ?? null) === effect1Value;
        if (unchanged) continue;
        await upsertQuality.mutateAsync({
          id: row?.id,
          name: t,
          iconUrl: row?.iconUrl ?? null,
          hp: d.hp.trim(),
          atk: d.atk.trim(),
          def: d.def.trim(),
          effect1Value,
          effectCount: count,
          sortOrder: QUALITY_TIERS.indexOf(t as QualityTier),
        });
      }

      // Build the module-level bonus rows (Effect 2/3) from the flat drafts.
      const payloadBonuses = bonuses
        .filter((b) => b.entityId && b.effectText.trim())
        .map((b, i) => ({
          slot: b.slot,
          mechId: (b.slot === 2 ? form.effect2Target : form.effect3Target) === "Mech" ? b.entityId : null,
          weaponId: (b.slot === 2 ? form.effect2Target : form.effect3Target) === "Weapon" ? b.entityId : null,
          effectText: b.effectText.trim(),
          sortOrder: i,
        }));
      await mutation.mutateAsync({ ...form, bonuses: payloadBonuses });
      navigate("/admin/modules");
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }

  if (isEdit && existing.isPending) return <p className="text-ink-dim">Loading…</p>;

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  return (
    <div className="max-w-2xl">
      <Link to="/admin/modules" className="text-sm text-ink-dim hover:text-accent">
        ← All modules
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${existing.data?.name ?? ""}` : "New module"}
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">
            Name *
          </label>
          <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={fieldCls} />
        </div>

        <ImageUploadField
          label="Icon"
          value={form.iconUrl ?? null}
          onChange={(url) => set("iconUrl", url)}
        />

        <div>
          <label className="mb-1 block text-sm font-semibold">Quality</label>
          <Dropdown
            ariaLabel="Quality"
            value={tier}
            onChange={(v) => setTier(v as QualityTier)}
            options={QUALITY_TIERS.map((t) => ({
              value: t,
              label: t,
              icon: <QualityIcon tier={t} size={16} />,
            }))}
          />

          <div className="mt-3 rounded-lg border border-edge bg-surface p-3">
            {/* Base attributes are the same for every module at a tier, so they
                live on the quality — editing them here changes them for all
                modules at {tier}. Switch the quality above to edit another tier. */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-dim">
              {tier} attributes (shared across all modules)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="hp" className="mb-1 block text-xs text-ink-dim">HP</label>
                <input id="hp" value={current.hp} onChange={(e) => setField("hp", e.target.value)} className={fieldCls} placeholder="0" />
              </div>
              <div>
                <label htmlFor="atk" className="mb-1 block text-xs text-ink-dim">ATK</label>
                <input id="atk" value={current.atk} onChange={(e) => setField("atk", e.target.value)} className={fieldCls} placeholder="0" />
              </div>
              <div>
                <label htmlFor="def" className="mb-1 block text-xs text-ink-dim">DEF</label>
                <input id="def" value={current.def} onChange={(e) => setField("def", e.target.value)} className={fieldCls} placeholder="0" />
              </div>
            </div>

            {/* Effect 1 unlocks at Turquoise. It's a single Elemental DMG % that
                applies to every element, so we show all the type icons + one
                input. */}
            {effectCount >= 1 && (
              <div className="mt-4 border-t border-edge pt-3">
                <label htmlFor="effect1" className="mb-1 block text-sm font-semibold">
                  Effect 1 · Elemental DMG
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(types.data ?? []).map((t) =>
                      t.iconUrl ? (
                        <img
                          key={t.id}
                          src={imageSrc(t.iconUrl)}
                          alt={t.name}
                          title={t.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : null
                    )}
                  </div>
                  <input
                    id="effect1"
                    value={current.effect1Value}
                    onChange={(e) => setField("effect1Value", e.target.value)}
                    className={`${fieldCls} max-w-[140px]`}
                    placeholder="e.g. +25%"
                  />
                </div>
                <p className="mt-1 text-xs text-ink-dim">
                  Applied to all elements at {tier} — the same for every module.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Effect 2 and Effect 3 bonuses are module-level (not per-quality) —
            they apply the same regardless of which quality unlocks the slot in
            game, so they're edited here independent of the Quality selector above. */}
        {bonusSection(2)}
        {bonusSection(3)}

        {saveError && <p className="text-sm text-fire">{saveError}</p>}

        <button
          type="submit"
          disabled={form.name.trim() === "" || mutation.isPending || upsertQuality.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create module"}
        </button>
      </form>
    </div>
  );
}
