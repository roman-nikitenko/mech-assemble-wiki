import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useCreateMech,
  useMech,
  usePilots,
  useTypes,
  useUpdateMech,
} from "../../api/client";
import type { MechInput, MechRank } from "../../api/types";
import { ImageUploadField } from "../ImageUploadField";
import { SavedToast } from "../SavedToast";
import { SkillTreeEditor } from "../skilltree/SkillTreeEditor";
import { draftsFromNodes, serializeDrafts, type SkillDraft } from "../skilltree/skillTreeDrafts";

const RANKS: MechRank[] = ["Standard", "S"];

interface SkinDraft {
  name: string;
  bonuses: string[]; // always 5 visible star slots; index i = ★(i+1)
  imageUrl: string | null;
}

const EMPTY: MechInput = { name: "", rank: "Standard", traitNames: [], pilotId: null, typeId: null };

/** One form for BOTH /admin/mechs/new and /admin/mechs/:id/edit — the
    presence of an :id route param decides which mode we're in. */
export function MechFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const location = useLocation();

  const existing = useMech(id ?? ""); // only meaningful in edit mode
  const createMech = useCreateMech();
  const updateMech = useUpdateMech(id ?? "");
  const pilots = usePilots();
  const types = useTypes();

  const [form, setForm] = useState<MechInput>(EMPTY);
  // 7 fixed rank-up slots. Positions are meaningful (slot 4 = rank 4), so
  // blanks are sent as-is — the server only trims trailing empties.
  const [rankUp, setRankUp] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [skins, setSkins] = useState<SkinDraft[]>([]);
  const [skillDrafts, setSkillDrafts] = useState<SkillDraft[]>([]);
  // Creating navigates to the edit route (this component remounts), so the
  // "it saved!" signal rides along in location.state to survive the hop.
  const [saved, setSaved] = useState<boolean>(
    (location.state as { justSaved?: boolean } | null)?.justSaved ?? false
  );

  // Prefill once the existing mech arrives (edit mode only).
  useEffect(() => {
    if (isEdit && existing.data) {
      const m = existing.data;
      setForm({
        name: m.name,
        epithet: m.epithet,
        typeId: m.type?.id ?? null,
        rank: m.rank,
        specialBonus: m.specialBonus,
        lore: m.lore,
        imageUrl: m.imageUrl,
        iconUrl: m.iconUrl,
        traitNames: m.traits.map((t) => t.trait.name),
        pilotId: m.pilot?.id ?? null,
      });
      // pad the stored list back out to the 7 visible slots
      setRankUp([...m.rankUpPreview, "", "", "", "", "", "", ""].slice(0, 7));
      // Stars are stored sparsely ({star, perk} rows) — spread them back
      // into the 5 positional slots so ★3 lands in slot 3.
      setSkins(
        m.skins.map((s) => {
          const bonuses = ["", "", "", "", ""];
          for (const st of s.stars) {
            if (st.star >= 1 && st.star <= 5) bonuses[st.star - 1] = st.perk;
          }
          return { name: s.name, bonuses, imageUrl: s.imageUrl };
        })
      );
      setSkillDrafts(draftsFromNodes(m.skillNodes));
    }
  }, [isEdit, existing.data]);

  const mutation = isEdit ? updateMech : createMech;

  function set<K extends keyof MechInput>(key: K, value: MechInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Traits are edited as plain text rows; the server matches them to the
  // catalog (or creates new entries) by name on save.
  function setTrait(i: number, value: string) {
    setForm((f) => ({
      ...f,
      traitNames: (f.traitNames ?? []).map((t, idx) => (idx === i ? value : t)),
    }));
  }

  function addTraitRow() {
    setForm((f) => ({ ...f, traitNames: [...(f.traitNames ?? []), ""] }));
  }

  function removeTraitRow(i: number) {
    setForm((f) => ({ ...f, traitNames: (f.traitNames ?? []).filter((_, idx) => idx !== i) }));
  }

  function addSkin() {
    setSkins((list) => [...list, { name: "", bonuses: ["", "", "", "", ""], imageUrl: null }]);
  }

  function removeSkin(index: number) {
    setSkins((list) => list.filter((_, i) => i !== index));
  }

  function setSkin(index: number, patch: Partial<SkinDraft>) {
    setSkins((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  const skillNameMissing = skillDrafts.some((d) => d.type !== "Core" && d.name.trim() === "");
  const skinNameMissing = skins.some((s) => s.name.trim() === "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // A non-S mech can't keep a pilot — clear the link if rank was switched.
    const payload = {
      ...form,
      pilotId: form.rank === "S" ? form.pilotId : null,
      rankUpPreview: rankUp,
      // Bonuses go positionally (blanks included) — the server keeps ★
      // numbers by index and skips the blank slots.
      skins: skins.map((s) => ({ name: s.name.trim(), bonuses: s.bonuses, imageUrl: s.imageUrl })),
      skills: serializeDrafts(skillDrafts),
    };
    mutation.mutate(payload, {
      onSuccess: (m) => {
        if (isEdit) {
          setSaved(true);
        } else {
          // Stay in the editor — but the mech exists now, so switch to the
          // edit route (saving again must PUT, not POST a duplicate).
          navigate(`/admin/mechs/${m.id}/edit`, { replace: true, state: { justSaved: true } });
        }
      },
    });
  }

  if (isEdit && existing.isPending) return <p className="text-ink-dim">Loading…</p>;

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  return (
    <div className="max-w-2xl">
      <SavedToast show={saved} onHide={() => setSaved(false)} />
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
            <label htmlFor="specialBonus" className="mb-1 block text-sm font-semibold">Special bonus</label>
            <input id="specialBonus" value={form.specialBonus ?? ""} onChange={(e) => set("specialBonus", e.target.value)} className={fieldCls} placeholder='e.g. "ATK +10%"' />
          </div>
        </div>

        <div>
          <label htmlFor="lore" className="mb-1 block text-sm font-semibold">Lore</label>
          <textarea id="lore" value={form.lore ?? ""} onChange={(e) => set("lore", e.target.value)} rows={3} className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm" />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Rank Up Preview</legend>
          <p className="mb-2 text-xs text-ink-dim">
            The number is the rank position — leave a slot empty if that rank
            grants nothing; it keeps its place.
          </p>
          <div className="space-y-2">
            {rankUp.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  aria-label={`Rank ${i + 1} preview`}
                  value={line}
                  onChange={(e) =>
                    setRankUp((list) => list.map((l, j) => (j === i ? e.target.value : l)))
                  }
                  className={fieldCls}
                  placeholder={`Rank ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Traits</legend>
          <div className="space-y-2">
            {(form.traitNames ?? []).map((trait, i) => (
              // Index keys are fine here: rows are plain values with no
              // internal state, and rows are only added/removed at known spots.
              <div key={i} className="flex gap-2">
                <input
                  aria-label={`Trait ${i + 1}`}
                  value={trait}
                  onChange={(e) => setTrait(i, e.target.value)}
                  placeholder="e.g. Thunder"
                  className={`${fieldCls} max-w-xs`}
                />
                <button
                  type="button"
                  aria-label={`Remove trait ${i + 1}`}
                  onClick={() => removeTraitRow(i)}
                  className="min-h-11 rounded-lg border border-fire/40 px-4 text-sm text-fire hover:bg-fire/10"
                >
                  −
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addTraitRow}
            className="mt-2 min-h-11 rounded-lg border border-edge px-4 text-sm hover:border-accent/60"
          >
            + Add trait
          </button>
        </fieldset>

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
                    className={fieldCls}
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
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Skills</legend>
          <p className="mb-2 text-xs text-ink-dim">
            Drag rows to reorder; drag right (or use ▶) to inherit from the
            skill above. Core skills have no name — only a description.
          </p>
          <SkillTreeEditor drafts={skillDrafts} onChange={setSkillDrafts} />
        </fieldset>

        {mutation.isError && <p className="text-sm text-fire">{(mutation.error as Error).message}</p>}

        <button
          type="submit"
          disabled={form.name.trim() === "" || mutation.isPending || skillNameMissing || skinNameMissing}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create mech"}
        </button>
      </form>
    </div>
  );
}
