import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreateModuleQuality, useModuleQualities, useUpdateModuleQuality } from "../../api/client";
import type { ModuleQualityInput } from "../../api/types";
import { QUALITY_TIERS } from "../../api/types";
import { ButtonGroup } from "../../components/ButtonGroup";
import { Dropdown } from "../../components/Dropdown";
import { QualityIcon } from "../../components/QualityIcon";
import { ImageUploadField } from "../ImageUploadField";

const EMPTY: ModuleQualityInput = { name: "", hp: "", atk: "", def: "", effect1Value: "", effectCount: 0, sortOrder: 0 };

const EFFECT_COUNT_OPTIONS = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

/** One form for /admin/module-qualities/new AND /admin/module-qualities/:id/edit.
    Edit mode prefills from the already-cached qualities list (there is no
    GET /:id — the list is small and always loaded by the table page). */
export function ModuleQualityFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const qualities = useModuleQualities();
  const createQuality = useCreateModuleQuality();
  const updateQuality = useUpdateModuleQuality(id ?? "");

  const [form, setForm] = useState<ModuleQualityInput>(EMPTY);

  useEffect(() => {
    if (isEdit && qualities.data) {
      const quality = qualities.data.find((q) => q.id === id);
      if (quality) {
        setForm({
          name: quality.name,
          iconUrl: quality.iconUrl,
          hp: quality.hp,
          atk: quality.atk,
          def: quality.def,
          effect1Value: quality.effect1Value ?? "",
          effectCount: quality.effectCount,
          sortOrder: quality.sortOrder,
        });
      }
    }
  }, [isEdit, id, qualities.data]);

  const mutation = isEdit ? updateQuality : createQuality;

  function set<K extends keyof ModuleQualityInput>(key: K, value: ModuleQualityInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Effect 1 only exists from effect_count 1 up; clear it otherwise.
    const payload: ModuleQualityInput = {
      ...form,
      effect1Value: form.effectCount >= 1 ? form.effect1Value : null,
    };
    mutation.mutate(payload, { onSuccess: () => navigate("/admin/module-qualities") });
  }

  if (isEdit && qualities.isPending) return <p className="text-ink-dim">Loading…</p>;

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";
  const canSubmit =
    form.name.trim() !== "" && form.hp.trim() !== "" && form.atk.trim() !== "" && form.def.trim() !== "";

  return (
    <div className="max-w-2xl">
      <Link to="/admin/module-qualities" className="text-sm text-ink-dim hover:text-accent">
        ← All module qualities
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New quality"}
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold">Quality tier *</label>
          {/* A quality row IS a tier (Blue→Mythic) — pick which tier's
              attributes this row defines. The name is unique, so one row per tier. */}
          <Dropdown
            ariaLabel="Quality tier"
            value={form.name}
            onChange={(v) => set("name", v)}
            options={QUALITY_TIERS.map((t) => ({
              value: t,
              label: t,
              icon: <QualityIcon tier={t} size={16} />,
            }))}
          />
        </div>

        <ImageUploadField
          label="Icon"
          value={form.iconUrl ?? null}
          onChange={(url) => set("iconUrl", url)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="hp" className="mb-1 block text-sm font-semibold">
              HP *
            </label>
            <input id="hp" value={form.hp} onChange={(e) => set("hp", e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="atk" className="mb-1 block text-sm font-semibold">
              ATK *
            </label>
            <input id="atk" value={form.atk} onChange={(e) => set("atk", e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="def" className="mb-1 block text-sm font-semibold">
              DEF *
            </label>
            <input id="def" value={form.def} onChange={(e) => set("def", e.target.value)} className={fieldCls} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Effect count</label>
          <ButtonGroup
            options={EFFECT_COUNT_OPTIONS}
            value={String(form.effectCount)}
            onChange={(v) => set("effectCount", Number(v))}
            ariaLabel="Effect count"
          />
        </div>

        {/* Effect 1 = the elemental DMG % this quality grants (applies to every
            element and every module). Only meaningful from effect_count 1 up. */}
        {form.effectCount >= 1 && (
          <div>
            <label htmlFor="effect1Value" className="mb-1 block text-sm font-semibold">
              Effect 1 — Elemental DMG
            </label>
            <input
              id="effect1Value"
              value={form.effect1Value ?? ""}
              onChange={(e) => set("effect1Value", e.target.value)}
              className={fieldCls}
              placeholder="e.g. +25%"
            />
            <p className="mt-1 text-xs text-ink-dim">
              Applied to all elements (Ice, Fire, …) for every module at this quality.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="sortOrder" className="mb-1 block text-sm font-semibold">
            Sort order
          </label>
          <input
            id="sortOrder"
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
            className={fieldCls}
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-fire">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create quality"}
        </button>
      </form>
    </div>
  );
}
