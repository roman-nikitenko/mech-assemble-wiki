import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useAccessories,
  useCreateMech,
  useMech,
  usePilots,
  useTypes,
  useUpdateMech,
  useWeapons,
} from "../../api/client";
import type { MechInput, MechRank } from "../../api/types";
import { QUALITY_TIERS } from "../../api/types";
import { Dropdown } from "../../components/Dropdown";
import { QualityIcon } from "../../components/QualityIcon";
import { STierIcon } from "../../components/STierIcon";
import { slugify } from "../../lib/slug";
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

const EMPTY: MechInput = {
  name: "",
  slug: "",
  rank: "Standard",
  traitNames: [],
  pilotId: null,
  weaponId: null,
  accessoryId: null,
  typeId: null,
};

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
  const weapons = useWeapons();
  const accessories = useAccessories();

  const [form, setForm] = useState<MechInput>(EMPTY);
  // 7 fixed rank-up slots. Positions are meaningful (slot 4 = rank 4), so
  // blanks are sent as-is — the server only trims trailing empties.
  const [rankUp, setRankUp] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [skins, setSkins] = useState<SkinDraft[]>([]);
  const [skillDrafts, setSkillDrafts] = useState<SkillDraft[]>([]);
  // Linked skills: standalone bonus skills gated on a partner WEAPON. Kept
  // separate from the main skill tree (they aren't part of the upgrade chain).
  const [linkedSkills, setLinkedSkills] = useState<
    { name: string; description: string; partnerId: string }[]
  >([]);
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
        slug: m.slug ?? "",
        epithet: m.epithet,
        typeId: m.type?.id ?? null,
        rank: m.rank,
        specialBonus: m.specialBonus,
        lore: m.lore,
        imageUrl: m.imageUrl,
        iconUrl: m.iconUrl,
        cardSkillIconUrl: m.cardSkillIconUrl,
        traitNames: m.traits.map((t) => t.trait.name),
        pilotId: m.pilot?.id ?? null,
        weaponId: m.weapon?.id ?? null,
        accessoryId: m.accessory?.id ?? null,
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
      // Linked skills come back as gated nodes on the mech (linkedWeaponId set).
      setLinkedSkills(
        m.skillNodes
          .filter((n) => n.linkedWeaponId)
          .map((n) => ({
            name: n.name ?? "",
            description: n.description ?? "",
            partnerId: n.linkedWeaponId!,
          }))
      );
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
      // Drop incomplete rows (no name or no partner); "" description → null.
      linkedSkills: linkedSkills
        .filter((l) => l.name.trim() !== "" && l.partnerId !== "")
        .map((l) => ({
          name: l.name.trim(),
          description: l.description.trim() || null,
          partnerId: l.partnerId,
        })),
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
          <label htmlFor="slug" className="mb-1 block text-sm font-semibold">
            URL slug
          </label>
          <input
            id="slug"
            value={form.slug ?? ""}
            onChange={(e) => set("slug", e.target.value)}
            className={fieldCls}
            placeholder="auto-generated from the name if left blank"
          />
          {/* The slug is the public page address: /mechs/<slug>. Leave it blank
              to derive it from the name; editing it changes the URL. */}
          <p className="mt-1 text-xs text-ink-dim">
            Public page address: <span className="font-mono">/mechs/{slugify(form.slug || form.name) || "…"}</span>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Type</label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
            {/* "None" first, then one icon+name button per catalog type. */}
            <button
              type="button"
              aria-label="Type none"
              aria-pressed={form.typeId === null}
              onClick={() => set("typeId", null)}
              className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors ${
                form.typeId === null
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-edge text-ink-dim hover:border-accent/50"
              }`}
            >
              — none —
            </button>
            {(types.data ?? []).map((t) => {
              const active = form.typeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-label={`Type ${t.name}`}
                  aria-pressed={active}
                  onClick={() => set("typeId", t.id)}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    active
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-edge text-ink-dim hover:border-accent/50"
                  }`}
                >
                  {t.iconUrl && (
                    <img src={t.iconUrl} alt="" className="h-5 w-5 object-contain" />
                  )}
                  
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-ink-dim">
            Every mech in the game has a type — assign one when you can.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Rank</label>
          <div className="flex gap-2" role="group" aria-label="Rank">
            {RANKS.map((r) => {
              const active = form.rank === r;
              return (
                <button
                  key={r}
                  type="button"
                  aria-label={`Rank ${r}`}
                  aria-pressed={active}
                  onClick={() => set("rank", r)}
                  className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    active
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-edge text-ink-dim hover:border-accent/50"
                  }`}
                >
                  {/* S-tier gets the drawn gold badge; Standard is label-only,
                      mirroring how RankBadge renders the two ranks. */}
                  {r === "S" && <STierIcon size={45} />}
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {form.rank === "S" && (
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Pilot
            </label>
            <Dropdown
              ariaLabel="Pilot"
              searchable
              value={form.pilotId ?? ""}
              onChange={(v) => set("pilotId", v || null)}
              options={[
                { value: "", label: "— no pilot —" },
                ...(pilots.data ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <p className="mt-1 text-xs text-ink-dim">
              Assigning a pilot moves them from any other mech.
            </p>
            {isEdit && (
              <Link
                to={`/admin/mechs/${id}/awakening`}
                className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-edge px-4 text-sm hover:border-accent/60"
              >
                Edit awakening →
              </Link>
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Linked weapon
            </label>
            <Dropdown
              ariaLabel="Linked weapon"
              searchable
              value={form.weaponId ?? ""}
              onChange={(v) => set("weaponId", v || null)}
              options={[
                { value: "", label: "— no weapon —" },
                ...(weapons.data ?? []).map((w) => ({
                  value: w.id,
                  label: `${w.name}${w.mech && w.mech.id !== id ? ` (on ${w.mech.name})` : ""}`,
                })),
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Linked accessory
            </label>
            <Dropdown
              ariaLabel="Linked accessory"
              searchable
              value={form.accessoryId ?? ""}
              onChange={(v) => set("accessoryId", v || null)}
              options={[
                { value: "", label: "— no accessory —" },
                ...(accessories.data ?? []).map((acc) => ({
                  value: acc.id,
                  label: `${acc.name}${acc.mech && acc.mech.id !== id ? ` (on ${acc.mech.name})` : ""}`,
                })),
              ]}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-ink-dim">
          Picking a weapon or accessory already on another mech moves it here.
        </p>

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
                <QualityIcon tier={QUALITY_TIERS[i]} />
                
                <input
                  aria-label={`Rank ${i + 1} preview`}
                  value={line}
                  onChange={(e) =>
                    setRankUp((list) => list.map((l, j) => (j === i ? e.target.value : l)))
                  }
                  className={fieldCls}
                  placeholder={QUALITY_TIERS[i]}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Traits</legend>
          <div className="space-y-2">
            {(form.traitNames ?? []).map((trait, i) => (
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

        <div className="grid gap-4 sm:grid-cols-3">
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
          <ImageUploadField
            label="Card skill icon"
            value={form.cardSkillIconUrl ?? null}
            onChange={(url) => set("cardSkillIconUrl", url)}
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

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Linked skills</legend>
          <p className="mb-2 text-xs text-ink-dim">
            Bonus skills that only become pickable in a build when this mech is
            paired with the chosen weapon.
          </p>
          <div className="space-y-2">
            {linkedSkills.map((row, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  aria-label={`Linked skill ${i + 1} name`}
                  value={row.name}
                  onChange={(e) =>
                    setLinkedSkills((list) =>
                      list.map((r, j) => (j === i ? { ...r, name: e.target.value } : r))
                    )
                  }
                  placeholder="Name"
                  className="min-h-11 flex-1 rounded-lg border border-edge bg-surface px-3 text-sm"
                />
                <input
                  aria-label={`Linked skill ${i + 1} description`}
                  value={row.description}
                  onChange={(e) =>
                    setLinkedSkills((list) =>
                      list.map((r, j) => (j === i ? { ...r, description: e.target.value } : r))
                    )
                  }
                  placeholder="Description"
                  className="min-h-11 flex-1 rounded-lg border border-edge bg-surface px-3 text-sm"
                />
                <select
                  aria-label={`Linked skill ${i + 1} weapon`}
                  value={row.partnerId}
                  onChange={(e) =>
                    setLinkedSkills((list) =>
                      list.map((r, j) => (j === i ? { ...r, partnerId: e.target.value } : r))
                    )
                  }
                  className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm"
                >
                  <option value="">— partner weapon —</option>
                  {(weapons.data ?? []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setLinkedSkills((list) => list.filter((_, j) => j !== i))}
                  aria-label={`Remove linked skill ${i + 1}`}
                  className="min-h-11 rounded-lg border border-edge px-3 text-sm hover:border-fire/60"
                >
                  −
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLinkedSkills((list) => [...list, { name: "", description: "", partnerId: "" }])}
            className="mt-2 min-h-11 rounded-lg border border-edge px-4 text-sm hover:border-accent/60"
          >
            + Add linked skill
          </button>
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
