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
import { QUALITY_TIERS } from "../../api/types";
import { Dropdown } from "../../components/Dropdown";
import { QualityIcon } from "../../components/QualityIcon";
import { STierIcon } from "../../components/STierIcon";
import { slugify } from "../../lib/slug";
import { ImageUploadField } from "../ImageUploadField";
import { SkillTreeEditor } from "../skilltree/SkillTreeEditor";
import { draftsFromNodes, serializeDrafts, type SkillDraft } from "../skilltree/skillTreeDrafts";

const TIERS: MechRank[] = ["Standard", "S"];

// One editable skin card in the form. The API receives {name, bonuses[], imageUrl}.
interface SkinDraft {
  name: string;
  bonuses: string[]; // always 5 visible star slots; blanks dropped on submit
  imageUrl: string | null;
}

const EMPTY: WeaponInput = { name: "", slug: "", tier: "Standard", typeId: null, mechId: null, pilotId: null };

/** One form for /admin/weapons/new AND /admin/weapons/:id/edit. */
export function WeaponFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const types = useTypes();
  const pilots = usePilots();
  // A mech of any rank can own a weapon, so the owner list is unfiltered.
  const ownerMechs = useMechs({});
  const weapons = useWeapons(); // edit-mode prefill source
  const createWeapon = useCreateWeapon();
  const updateWeapon = useUpdateWeapon(id ?? "");

  const [form, setForm] = useState<WeaponInput>(EMPTY);
  // 7 visible rank-up slots (Lv.1-7); blanks dropped on submit.
  const [rankUp, setRankUp] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [skins, setSkins] = useState<SkinDraft[]>([]);
  const [skillDrafts, setSkillDrafts] = useState<SkillDraft[]>([]);
  // Linked skills: standalone bonus skills gated on a partner MECH.
  const [linkedSkills, setLinkedSkills] = useState<
    { name: string; description: string; partnerId: string }[]
  >([]);

  useEffect(() => {
    if (isEdit && weapons.data) {
      const weapon = weapons.data.find((w) => w.id === id);
      if (weapon) {
        setForm({
          name: weapon.name,
          slug: weapon.slug ?? "",
          description: weapon.description,
          linkedEffect: weapon.linkedEffect,
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
        // Linked skills come back as gated nodes on the weapon (linkedMechId).
        setLinkedSkills(
          weapon.skillNodes
            .filter((n) => n.linkedMechId)
            .map((n) => ({
              name: n.name ?? "",
              description: n.description ?? "",
              partnerId: n.linkedMechId!,
            }))
        );
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
        linkedSkills: linkedSkills
          .filter((l) => l.name.trim() !== "" && l.partnerId !== "")
          .map((l) => ({
            name: l.name.trim(),
            description: l.description.trim() || null,
            partnerId: l.partnerId,
          })),
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
          {/* The slug is the public page address: /weapons/<slug>. Leave it
              blank to derive it from the name; editing it changes the URL. */}
          <p className="mt-1 text-xs text-ink-dim">
            Public page address: <span className="font-mono">/weapons/{slugify(form.slug || form.name) || "…"}</span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
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
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Tier</label>
            <div className="flex gap-2" role="group" aria-label="Tier">
              {TIERS.map((t) => {
                const active = form.tier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-label={`Tier ${t}`}
                    aria-pressed={active}
                    onClick={() => set("tier", t)}
                    className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                      active
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-edge text-ink-dim hover:border-accent/50"
                    }`}
                  >
                    {/* S-tier gets the drawn gold badge; Standard is label-only,
                        mirroring how RankBadge renders the two ranks. */}
                    {t === "S" && <STierIcon size={18} />}
                    {t}
                  </button>
                );
              })}
            </div>
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
          <div className="grid gap-2 sm:grid-cols-1">
            {rankUp.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <QualityIcon tier={QUALITY_TIERS[i]} />
                <input
                  aria-label={`Rank ${i + 1} preview`}
                  value={line}
                  onChange={(e) => setRankUp((list) => list.map((l, j) => (j === i ? e.target.value : l)))}
                  className={fieldCls}
                  placeholder={QUALITY_TIERS[i]}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-1">
          <div>
            <label className="mb-1 block text-sm font-semibold">Pilot</label>
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
              Assigning un-seats the pilot from any mech or other weapon.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Owner mech</label>
            <Dropdown
              ariaLabel="Owner mech"
              searchable
              value={form.mechId ?? ""}
              onChange={(v) => set("mechId", v || null)}
              options={[
                { value: "", label: "— no mech —" },
                ...(ownerMechs.data ?? []).map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          </div>
        </div>

        <div>
          <label htmlFor="linkedEffect" className="mb-1 block text-sm font-semibold">
            Linked effect
          </label>
          <input
            id="linkedEffect"
            value={form.linkedEffect ?? ""}
            onChange={(e) => set("linkedEffect", e.target.value)}
            className={fieldCls}
            placeholder="Bonus shown on the owner mech while this weapon is linked"
          />
          {/* Only meaningful for a mech-linked weapon; the server clears it
              when there's no owner mech, so the hint sets expectations. */}
          <p className="mt-1 text-xs text-ink-dim">
            Only applies while this weapon is linked to an owner mech. Saved as
            empty if no owner mech is set.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
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

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Linked skills</legend>
          <p className="mb-2 text-xs text-ink-dim">
            Bonus skills that only become pickable in a build when this weapon is
            paired with the chosen mech.
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
                  aria-label={`Linked skill ${i + 1} mech`}
                  value={row.partnerId}
                  onChange={(e) =>
                    setLinkedSkills((list) =>
                      list.map((r, j) => (j === i ? { ...r, partnerId: e.target.value } : r))
                    )
                  }
                  className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm"
                >
                  <option value="">— partner mech —</option>
                  {(ownerMechs.data ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
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
