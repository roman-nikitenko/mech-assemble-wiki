import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useCreatePilot,
  useMechs,
  usePilots,
  useUpdatePilot,
} from "../../api/client";
import type { PilotInput } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";

const EMPTY: PilotInput = { name: "", mechId: null };

/** One form for /admin/pilots/new AND /admin/pilots/:id/edit. Edit mode
    prefills from the already-cached pilots list (there is no GET /:id —
    the list is small and always loaded by the table page). */
export function PilotFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  // Only S-tier mechs can carry a pilot — ask the API for exactly those.
  const sMechs = useMechs({ rank: "S" });
  const pilots = usePilots();
  const createPilot = useCreatePilot();
  const updatePilot = useUpdatePilot(id ?? "");

  const [form, setForm] = useState<PilotInput>(EMPTY);
  // Always four visible slots (Lv.1-4); blanks are dropped on submit.
  const [bonuses, setBonuses] = useState<string[]>(["", "", "", ""]);

  useEffect(() => {
    if (isEdit && pilots.data) {
      const pilot = pilots.data.find((p) => p.id === id);
      if (pilot) {
        setForm({
          name: pilot.name,
          unlockBoost: pilot.unlockBoost,
          relationshipBonus: pilot.relationshipBonus,
          iconUrl: pilot.iconUrl,
          backgroundUrl: pilot.backgroundUrl,
          mechId: pilot.mech?.id ?? null,
        });
        // pad the stored list back out to 4 visible slots
        setBonuses([...pilot.bonusPerLevel, "", "", "", ""].slice(0, 4));
      }
    }
  }, [isEdit, id, pilots.data]);

  const mutation = isEdit ? updatePilot : createPilot;

  function set<K extends keyof PilotInput>(key: K, value: PilotInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setBonus(index: number, value: string) {
    setBonuses((list) => list.map((b, i) => (i === index ? value : b)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      { ...form, bonusPerLevel: bonuses.filter((b) => b.trim() !== "") },
      { onSuccess: () => navigate("/admin/pilots") }
    );
  }

  if (isEdit && pilots.isPending) return <p className="text-ink-dim">Loading…</p>;

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  return (
    <div className="max-w-2xl">
      <Link to="/admin/pilots" className="text-sm text-ink-dim hover:text-accent">
        ← All pilots
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New pilot"}
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
            <label htmlFor="unlockBoost" className="mb-1 block text-sm font-semibold">
              Unlock boost
            </label>
            <input
              id="unlockBoost"
              value={form.unlockBoost ?? ""}
              onChange={(e) => set("unlockBoost", e.target.value)}
              className={fieldCls}
              placeholder='e.g. "ATK +5%"'
            />
          </div>
          <div>
            <label htmlFor="mech" className="mb-1 block text-sm font-semibold">
              Linked S-tier mech
            </label>
            <select
              id="mech"
              value={form.mechId ?? ""}
              onChange={(e) => set("mechId", e.target.value || null)}
              className={fieldCls}
            >
              <option value="">— no mech —</option>
              {(sMechs.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-dim">
              Linking here moves the pilot from any other mech.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="relationshipBonus" className="mb-1 block text-sm font-semibold">
            Relationship bonus
          </label>
          <input
            id="relationshipBonus"
            value={form.relationshipBonus ?? ""}
            onChange={(e) => set("relationshipBonus", e.target.value)}
            className={fieldCls}
            placeholder='e.g. "Thunder damage +10%"'
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Bonus per level</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {bonuses.map((bonus, i) => (
              <input
                key={i}
                aria-label={`Level ${i + 1} bonus`}
                value={bonus}
                onChange={(e) => setBonus(i, e.target.value)}
                className={fieldCls}
                placeholder={`Lv.${i + 1}`}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploadField
            label="Icon"
            value={form.iconUrl ?? null}
            onChange={(url) => set("iconUrl", url)}
          />
          <ImageUploadField
            label="Background"
            value={form.backgroundUrl ?? null}
            onChange={(url) => set("backgroundUrl", url)}
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
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create pilot"}
        </button>
      </form>
    </div>
  );
}
