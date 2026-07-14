import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAccessories,
  useCreateAccessory,
  useMechs,
  useUpdateAccessory,
} from "../../api/client";
import type { AccessoryAttribute, AccessoryInput, MechRank } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";

const TIERS: MechRank[] = ["Standard", "S"];

const EMPTY: AccessoryInput = { name: "", tier: "Standard", mechId: null };

/** One form for /admin/accessories/new AND /admin/accessories/:id/edit.
    Conditionality mirrors the API rules: mech link only for S tier; the
    exclusive effect only when a mech is chosen; attribute rows 2 (S) / 1
    (Standard). */
export function AccessoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const sMechs = useMechs({ rank: "S" });
  const accessories = useAccessories(); // edit prefill source
  const createAccessory = useCreateAccessory();
  const updateAccessory = useUpdateAccessory(id ?? "");

  const [form, setForm] = useState<AccessoryInput>(EMPTY);
  // Always two row-drafts; the second is only VISIBLE (and submitted) on S.
  const [attrs, setAttrs] = useState<AccessoryAttribute[]>([
    { name: "", value: "" },
    { name: "", value: "" },
  ]);

  useEffect(() => {
    if (isEdit && accessories.data) {
      const accessory = accessories.data.find((a) => a.id === id);
      if (accessory) {
        setForm({
          name: accessory.name,
          tier: accessory.tier,
          mechId: accessory.mech?.id ?? null,
          exclusiveEffect: accessory.exclusiveEffect,
          imageUrl: accessory.imageUrl,
          iconUrl: accessory.iconUrl,
        });
        setAttrs([
          accessory.attributes[0] ?? { name: "", value: "" },
          accessory.attributes[1] ?? { name: "", value: "" },
        ]);
      }
    }
  }, [isEdit, id, accessories.data]);

  const mutation = isEdit ? updateAccessory : createAccessory;
  const visibleRows = form.tier === "S" ? 2 : 1;

  function set<K extends keyof AccessoryInput>(key: K, value: AccessoryInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setAttr(index: number, patch: Partial<AccessoryAttribute>) {
    setAttrs((list) => list.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      {
        ...form,
        // only the visible rows travel; the API drops blank-name rows
        attributes: attrs.slice(0, visibleRows),
      },
      { onSuccess: () => navigate("/admin/accessories") }
    );
  }

  if (isEdit && accessories.isPending) return <p className="text-ink-dim">Loading…</p>;

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  return (
    <div className="max-w-2xl">
      <Link to="/admin/accessories" className="text-sm text-ink-dim hover:text-accent">
        ← All accessories
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New accessory"}
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">
            Name *
          </label>
          <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={fieldCls} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tier" className="mb-1 block text-sm font-semibold">Tier</label>
            <select
              id="tier"
              value={form.tier}
              onChange={(e) => {
                const tier = e.target.value as MechRank;
                // dropping to Standard un-links the mech and clears the
                // effect — mirrors the API rules
                setForm((f) => ({
                  ...f,
                  tier,
                  mechId: tier === "S" ? f.mechId : null,
                  exclusiveEffect: tier === "S" ? f.exclusiveEffect : null,
                }));
              }}
              className={fieldCls}
            >
              {TIERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          {form.tier === "S" && (
            <div>
              <label htmlFor="mech" className="mb-1 block text-sm font-semibold">
                Linked S-tier mech
              </label>
              <select
                id="mech"
                value={form.mechId ?? ""}
                onChange={(e) => {
                  const mechId = e.target.value || null;
                  setForm((f) => ({
                    ...f,
                    mechId,
                    exclusiveEffect: mechId ? f.exclusiveEffect : null,
                  }));
                }}
                className={fieldCls}
              >
                <option value="">— no mech —</option>
                {(sMechs.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Base attributes</legend>
          <div className="space-y-2">
            {attrs.slice(0, visibleRows).map((attr, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <input
                  aria-label={`Attribute ${i + 1} name`}
                  value={attr.name}
                  onChange={(e) => setAttr(i, { name: e.target.value })}
                  className={fieldCls}
                  placeholder="e.g. HP"
                />
                <input
                  aria-label={`Attribute ${i + 1} value`}
                  value={attr.value}
                  onChange={(e) => setAttr(i, { value: e.target.value })}
                  className={fieldCls}
                  placeholder="e.g. 42.00k"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {form.mechId && (
          <div>
            <label htmlFor="exclusiveEffect" className="mb-1 block text-sm font-semibold">
              Exclusive effect
            </label>
            <textarea
              id="exclusiveEffect"
              value={form.exclusiveEffect ?? ""}
              onChange={(e) => set("exclusiveEffect", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploadField
            label="Image"
            value={form.imageUrl ?? null}
            onChange={(url) => set("imageUrl", url)}
          />
          <ImageUploadField
            label="Icon"
            value={form.iconUrl ?? null}
            onChange={(url) => set("iconUrl", url)}
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-fire">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={form.name.trim() === "" || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create accessory"}
        </button>
      </form>
    </div>
  );
}
