import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useCreateMech,
  useCreateTrait,
  useMech,
  usePilots,
  useTraits,
  useTypes,
  useUpdateMech,
} from "../../api/client";
import type { MechInput, MechRank } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";

const RANKS: MechRank[] = ["Standard", "S"];

const EMPTY: MechInput = { name: "", rank: "Standard", traitIds: [], pilotId: null, typeId: null };

/** One form for BOTH /admin/mechs/new and /admin/mechs/:id/edit — the
    presence of an :id route param decides which mode we're in. */
export function MechFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const traits = useTraits();
  const existing = useMech(id ?? ""); // only meaningful in edit mode
  const createMech = useCreateMech();
  const updateMech = useUpdateMech(id ?? "");
  const createTrait = useCreateTrait();
  const pilots = usePilots();
  const types = useTypes();

  const [form, setForm] = useState<MechInput>(EMPTY);
  const [newTrait, setNewTrait] = useState("");

  // Prefill once the existing mech arrives (edit mode only).
  useEffect(() => {
    if (isEdit && existing.data) {
      const m = existing.data;
      setForm({
        name: m.name,
        epithet: m.epithet,
        typeId: m.type?.id ?? null,
        rank: m.rank,
        quality: m.quality,
        specialBonus: m.specialBonus,
        pilotName: m.pilotName,
        lore: m.lore,
        imageUrl: m.imageUrl,
        traitIds: m.traits.map((t) => t.trait.id),
        pilotId: m.pilot?.id ?? null,
      });
    }
  }, [isEdit, existing.data]);

  const mutation = isEdit ? updateMech : createMech;

  function set<K extends keyof MechInput>(key: K, value: MechInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Functional update: safe even when called from async callbacks that
  // captured an older `form`.
  function toggleTrait(traitId: string) {
    setForm((f) => {
      const current = f.traitIds ?? [];
      return {
        ...f,
        traitIds: current.includes(traitId)
          ? current.filter((t) => t !== traitId)
          : [...current, traitId],
      };
    });
  }

  function addTrait() {
    if (!newTrait.trim()) return;
    createTrait.mutate(
      { name: newTrait.trim() },
      {
        onSuccess: (trait) => {
          setNewTrait("");
          toggleTrait(trait.id); // auto-check the newly created trait
        },
      }
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // A non-S mech can't keep a pilot — clear the link if rank was switched.
    const payload = { ...form, pilotId: form.rank === "S" ? form.pilotId : null };
    mutation.mutate(payload, { onSuccess: () => navigate("/admin/mechs") });
  }

  if (isEdit && existing.isPending) return <p className="text-ink-dim">Loading…</p>;

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  return (
    <div className="max-w-2xl">
      <Link to="/admin/mechs" className="text-sm text-ink-dim hover:text-accent">
        ← All mechs
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${existing.data?.name ?? ""}` : "New mech"}
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">
            Name *
          </label>
          <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={fieldCls} />
        </div>

        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-semibold">Type</label>
          <select
            id="type"
            value={form.typeId ?? ""}
            onChange={(e) => set("typeId", e.target.value || null)}
            className={fieldCls}
          >
            <option value="">— no type —</option>
            {(types.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-dim">
            Every mech in the game has a type — assign one when you can.
          </p>
        </div>

        <div>
          <label htmlFor="rank" className="mb-1 block text-sm font-semibold">Rank</label>
          <select id="rank" value={form.rank} onChange={(e) => set("rank", e.target.value as MechRank)} className={fieldCls}>
            {RANKS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {form.rank === "S" && (
          <div>
            <label htmlFor="pilot" className="mb-1 block text-sm font-semibold">
              Pilot
            </label>
            <select
              id="pilot"
              value={form.pilotId ?? ""}
              onChange={(e) => set("pilotId", e.target.value || null)}
              className={fieldCls}
            >
              <option value="">— no pilot —</option>
              {(pilots.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-dim">
              Assigning a pilot moves them from any other mech.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="epithet" className="mb-1 block text-sm font-semibold">Epithet</label>
            <input id="epithet" value={form.epithet ?? ""} onChange={(e) => set("epithet", e.target.value)} className={fieldCls} placeholder="e.g. Shadow Hunter" />
          </div>
          <div>
            <label htmlFor="quality" className="mb-1 block text-sm font-semibold">Quality</label>
            <input id="quality" value={form.quality ?? ""} onChange={(e) => set("quality", e.target.value)} className={fieldCls} placeholder="e.g. Supreme" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="specialBonus" className="mb-1 block text-sm font-semibold">Special bonus</label>
            <input id="specialBonus" value={form.specialBonus ?? ""} onChange={(e) => set("specialBonus", e.target.value)} className={fieldCls} placeholder='e.g. "ATK +10%"' />
          </div>
          <div>
            <label htmlFor="pilotName" className="mb-1 block text-sm font-semibold">Pilot</label>
            <input id="pilotName" value={form.pilotName ?? ""} onChange={(e) => set("pilotName", e.target.value)} className={fieldCls} />
          </div>
        </div>

        <div>
          <label htmlFor="lore" className="mb-1 block text-sm font-semibold">Lore</label>
          <textarea id="lore" value={form.lore ?? ""} onChange={(e) => set("lore", e.target.value)} rows={3} className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm" />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Traits</legend>
          {traits.isPending ? (
            <p className="text-sm text-ink-dim">Loading traits…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(traits.data ?? []).map((trait) => {
                const checked = (form.traitIds ?? []).includes(trait.id);
                return (
                  <label
                    key={trait.id}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${
                      checked ? "border-accent/60 bg-surface-2" : "border-edge bg-surface"
                    }`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleTrait(trait.id)} />
                    {trait.name}
                  </label>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <input
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value)}
              placeholder="New trait name"
              className={`${fieldCls} max-w-xs`}
            />
            <button
              type="button"
              onClick={addTrait}
              disabled={createTrait.isPending}
              className="min-h-11 rounded-lg border border-edge px-4 text-sm hover:border-accent/60 disabled:opacity-60"
            >
              Add trait
            </button>
          </div>
          {createTrait.isError && (
            <p className="mt-1 text-sm text-fire">{(createTrait.error as Error).message}</p>
          )}
        </fieldset>

        <ImageUploadField value={form.imageUrl ?? null} onChange={(url) => set("imageUrl", url)} />

        {mutation.isError && <p className="text-sm text-fire">{(mutation.error as Error).message}</p>}

        <button
          type="submit"
          disabled={form.name.trim() === "" || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create mech"}
        </button>
      </form>
    </div>
  );
}
