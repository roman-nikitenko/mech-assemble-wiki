import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useCreateWeapon,
  useMechs,
  usePilots,
  useTypes,
  useUpdateWeapon,
  useWeapons,
} from "../../api/client";
import type { MechRank, WeaponInput } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";
import { SkillTreeEditor } from "./SkillTreeEditor";
import { draftsFromNodes, serializeDrafts, type SkillDraft } from "./skillTreeDrafts";

const TIERS: MechRank[] = ["Standard", "S"];

// One editable skin card in the form. The API receives {name, bonuses[], imageUrl}.
interface SkinDraft {
  name: string;
  bonuses: string[]; // always 5 visible star slots; blanks dropped on submit
  imageUrl: string | null;
}

const EMPTY: WeaponInput = { name: "", tier: "Standard", typeId: null, mechId: null, pilotId: null };

/** One form for /admin/weapons/new AND /admin/weapons/:id/edit. */
export function WeaponFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const types = useTypes();
  const pilots = usePilots();
  const sMechs = useMechs({ rank: "S" });
  const weapons = useWeapons(); // edit-mode prefill source
  const createWeapon = useCreateWeapon();
  const updateWeapon = useUpdateWeapon(id ?? "");

  const [form, setForm] = useState<WeaponInput>(EMPTY);
  // 7 visible rank-up slots (Lv.1-7); blanks dropped on submit.
  const [rankUp, setRankUp] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [skins, setSkins] = useState<SkinDraft[]>([]);
  const [skillDrafts, setSkillDrafts] = useState<SkillDraft[]>([]);

  useEffect(() => {
    if (isEdit && weapons.data) {
      const weapon = weapons.data.find((w) => w.id === id);
      if (weapon) {
        setForm({
          name: weapon.name,
          description: weapon.description,
          tier: weapon.tier,
          typeId: weapon.type?.id ?? null,
          mechId: weapon.mech?.id ?? null,
          pilotId: weapon.pilot?.id ?? null,
          imageUrl: weapon.imageUrl,
          iconUrl: weapon.iconUrl,
        });
        // pad stored lists back out to their fixed visible slot counts
        setRankUp([...weapon.rankUpPreview, "", "", "", "", "", "", ""].slice(0, 7));
        setSkins(
          weapon.weaponSkins.map((s) => ({
            name: s.name,
            bonuses: [...s.bonuses, "", "", "", "", ""].slice(0, 5),
            imageUrl: s.imageUrl,
          }))
        );
        setSkillDrafts(draftsFromNodes(weapon.skillNodes));
      }
    }
  }, [isEdit, id, weapons.data]);

  const mutation = isEdit ? updateWeapon : createWeapon;

  function set<K extends keyof WeaponInput>(key: K, value: WeaponInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSkin() {
    // 5 star slots (★1-5), matching the game's weapon-skin star track.
    setSkins((list) => [...list, { name: "", bonuses: ["", "", "", "", ""], imageUrl: null }]);
  }

  function removeSkin(index: number) {
    setSkins((list) => list.filter((_, i) => i !== index));
  }

  function setSkin(index: number, patch: Partial<SkinDraft>) {
    setSkins((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  const skinNameMissing = skins.some((s) => s.name.trim() === "");
  const skillNameMissing = skillDrafts.some((d) => d.type !== "Core" && d.name.trim() === "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      {
        ...form,
        rankUpPreview: rankUp.filter((r) => r.trim() !== ""),
        skins: skins.map((s) => ({
          name: s.name.trim(),
          bonuses: s.bonuses.filter((b) => b.trim() !== ""),
          imageUrl: s.imageUrl,
        })),
        skills: serializeDrafts(skillDrafts),
      },
      { onSuccess: () => navigate("/admin/weapons") }
    );
  }

  if (isEdit && weapons.isPending) return <p className="text-ink-dim">Loading…</p>;

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  return (
    <div className="max-w-2xl">
      <Link to="/admin/weapons" className="text-sm text-ink-dim hover:text-accent">
        ← All weapons
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">
        {isEdit ? `Edit ${form.name}` : "New weapon"}
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
            <label htmlFor="type" className="mb-1 block text-sm font-semibold">Type</label>
            <select
              id="type"
              value={form.typeId ?? ""}
              onChange={(e) => set("typeId", e.target.value || null)}
              className={fieldCls}
            >
              <option value="">— no type —</option>
              {(types.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tier" className="mb-1 block text-sm font-semibold">Tier</label>
            <select
              id="tier"
              value={form.tier}
              onChange={(e) => set("tier", e.target.value as MechRank)}
              className={fieldCls}
            >
              {TIERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold">Description</label>
          <textarea
            id="description"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Rank-up preview</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {rankUp.map((line, i) => (
              <input
                key={i}
                aria-label={`Rank ${i + 1} preview`}
                value={line}
                onChange={(e) => setRankUp((list) => list.map((l, j) => (j === i ? e.target.value : l)))}
                className={fieldCls}
                placeholder={`Lv.${i + 1}`}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pilot" className="mb-1 block text-sm font-semibold">Pilot</label>
            <select
              id="pilot"
              value={form.pilotId ?? ""}
              onChange={(e) => set("pilotId", e.target.value || null)}
              className={fieldCls}
            >
              <option value="">— no pilot —</option>
              {(pilots.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-dim">
              Assigning un-seats the pilot from any mech or other weapon.
            </p>
          </div>
          <div>
            <label htmlFor="mech" className="mb-1 block text-sm font-semibold">Owner mech</label>
            <select
              id="mech"
              value={form.mechId ?? ""}
              onChange={(e) => set("mechId", e.target.value || null)}
              className={fieldCls}
            >
              <option value="">— no mech —</option>
              {(sMechs.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

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

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Skins</legend>
          <div className="space-y-3">
            {skins.map((skin, i) => (
              <div key={i} className="rounded-xl border border-edge bg-surface/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <input
                    aria-label={`Skin ${i + 1} name`}
                    value={skin.name}
                    onChange={(e) => setSkin(i, { name: e.target.value })}
                    className={`${fieldCls}`}
                    placeholder="Skin name *"
                  />
                  <button
                    type="button"
                    aria-label={`Remove skin ${i + 1}`}
                    onClick={() => removeSkin(i)}
                    className="min-h-11 rounded border border-fire/40 px-3 text-xs text-fire hover:bg-fire/10"
                  >
                    Remove skin {i + 1}
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {skin.bonuses.map((bonus, j) => (
                    <input
                      key={j}
                      aria-label={`Skin ${i + 1} bonus ${j + 1}`}
                      value={bonus}
                      onChange={(e) =>
                        setSkin(i, { bonuses: skin.bonuses.map((b, k) => (k === j ? e.target.value : b)) })
                      }
                      className={fieldCls}
                      placeholder={`★${j + 1} bonus`}
                    />
                  ))}
                </div>
                <div className="mt-3">
                  <ImageUploadField
                    label={`Skin ${i + 1} image`}
                    value={skin.imageUrl}
                    onChange={(url) => setSkin(i, { imageUrl: url })}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSkin}
            className="mt-2 min-h-11 rounded-lg border border-edge px-4 text-sm hover:border-accent/60"
          >
            + Add skin
          </button>
          {/* Future: "SS skin" variant — fields unknown until the game data
              is confirmed; this list is where it will slot in. */}
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Skills</legend>
          <p className="mb-2 text-xs text-ink-dim">
            Drag rows to reorder; drag right (or use ▶) to inherit from the
            skill above. Core skills have no name — only a description.
          </p>
          <SkillTreeEditor drafts={skillDrafts} onChange={setSkillDrafts} />
        </fieldset>

        {mutation.isError && (
          <p className="text-sm text-fire">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={form.name.trim() === "" || skinNameMissing || skillNameMissing || mutation.isPending}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create weapon"}
        </button>
      </form>
    </div>
  );
}
