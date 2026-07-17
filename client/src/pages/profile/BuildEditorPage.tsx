import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { imageSrc, useMech, useMechs, useTypes, useWeapons } from "../../api/client";
import type { MechRank, WeaponSummary } from "../../api/types";
import { getBuild, saveBuild } from "../../profile/buildStorage";
import { resolvePicks } from "../../profile/buildRules";
import { SkillsBlock } from "../../profile/SkillsBlock";
import { RankBadge } from "../../components/RankBadge";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";

export const MAX_WEAPONS = 4;

// The 4 weapon squares sit at the corners of an invisible square centered
// on the mech art (layout chosen by the user from mockups).
const WEAPON_SLOT_POS = [
  "left-[8%] top-[14%]",
  "right-[8%] top-[14%]",
  "left-[8%] bottom-[14%]",
  "right-[8%] bottom-[14%]",
];

/** Two-step build editor: pick a mech, then assemble up to 8 skills under
    the game's unlock rules (see buildRules) plus up to 4 weapons in the
    banner's corner squares. One component for /new and /:buildId/edit —
    the route param decides. */
export function BuildEditorPage() {
  const { buildId } = useParams<{ buildId: string }>();
  const navigate = useNavigate();

  // Loaded once — localStorage is synchronous, no query needed.
  const [existing] = useState(() => (buildId ? getBuild(buildId) : undefined));
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [mechId, setMechId] = useState<string | null>(existing?.mechId ?? null);
  const [pickedIds, setPickedIds] = useState<string[]>(existing?.skillIds ?? []);
  const [weaponIds, setWeaponIds] = useState<string[]>(existing?.weaponIds ?? []);
  // Per-weapon skill picks, keyed by weapon id — each block edits its slice.
  const [weaponSkillIds, setWeaponSkillIds] = useState<Record<string, string[]>>(
    existing?.weaponSkillIds ?? {}
  );
  // Weapon strip filters — each one narrows the strip; blank = show all.
  const [weaponName, setWeaponName] = useState("");
  const [weaponTypeId, setWeaponTypeId] = useState("");
  const [weaponTier, setWeaponTier] = useState<MechRank | "">("");

  const mechs = useMechs({});
  const detail = useMech(mechId ?? "");
  const weapons = useWeapons();
  const types = useTypes();

  if (buildId && !existing) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-ink-dim">Build not found in this browser.</p>
        <Link to="/profile" className="text-accent underline">Back to profile</Link>
      </main>
    );
  }

  // ----- step 1: mech picker -----
  if (mechId === null) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/profile" className="text-sm text-ink-dim hover:text-accent">← My Profile</Link>
        <h2 className="mt-2 text-xl font-bold">Choose a mech</h2>
        {mechs.isPending ? (
          <LoadingSkeleton variant="cards" />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(mechs.data ?? []).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMechId(m.id)}
                className="rounded-xl border border-edge bg-surface p-4 text-left hover:border-accent/60"
              >
                {m.imageUrl && (
                  <img
                    src={imageSrc(m.imageUrl)}
                    alt=""
                    className="mb-2 h-28 w-full rounded-lg border border-edge object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{m.name}</p>
                  <RankBadge rank={m.rank} />
                </div>
                {m.epithet && <p className="text-sm text-ink-dim">{m.epithet}</p>}
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  // ----- step 2: the build board -----
  const mech = detail.data;
  const skills = mech?.skillNodes ?? [];

  // Equipped weapons resolved against the live list; a stored id whose
  // weapon was deleted from the wiki simply doesn't render.
  const allWeapons = weapons.data ?? [];
  const equipped = weaponIds
    .map((id) => allWeapons.find((w) => w.id === id))
    .filter((w): w is WeaponSummary => w !== undefined);
  const weaponsFull = weaponIds.length >= MAX_WEAPONS;
  const q = weaponName.trim().toLowerCase();
  const filteredWeapons = allWeapons.filter(
    (w) =>
      (q === "" || w.name.toLowerCase().includes(q)) &&
      (weaponTypeId === "" || w.type?.id === weaponTypeId) &&
      (weaponTier === "" || w.tier === weaponTier)
  );

  function addWeapon(id: string) {
    if (weaponIds.includes(id) || weaponsFull) return;
    setWeaponIds([...weaponIds, id]);
  }

  function removeWeapon(id: string) {
    setWeaponIds(weaponIds.filter((w) => w !== id));
    // Its skill picks go with it — re-equipping starts fresh.
    setWeaponSkillIds((prev) => {
      const { [id]: _dropped, ...rest } = prev;
      return rest;
    });
  }

  function changeMech() {
    // A different mech has a different skill pool — picks can't survive.
    // Weapons (and their skill picks) stay: any weapon fits any mech.
    setMechId(null);
    setPickedIds([]);
  }

  function save() {
    const now = new Date().toISOString();
    // Only prune stale ids once the live lists have loaded — saving during
    // a fetch must not silently drop equipment or picks.
    const savedWeaponIds = weapons.data ? equipped.map((w) => w.id) : weaponIds;
    saveBuild({
      id: existing?.id ?? crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      mechId: mechId!,
      skillIds: resolvePicks(skills, pickedIds).map((p) => p.id),
      weaponIds: savedWeaponIds,
      weaponSkillIds: Object.fromEntries(
        savedWeaponIds.map((id) => {
          const w = allWeapons.find((x) => x.id === id);
          const ids = weaponSkillIds[id] ?? [];
          return [id, w ? resolvePicks(w.skillNodes, ids).map((s) => s.id) : ids];
        })
      ),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    navigate("/profile");
  }

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/profile" className="text-sm text-ink-dim hover:text-accent">← My Profile</Link>

      {/* hero banner from the mech's art (765px per design request) */}
      <div className="relative mt-3 h-[765px] overflow-hidden rounded-xl border border-edge bg-surface">
        {mech?.imageUrl && (
          <img src={imageSrc(mech.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

        {/* 4 weapon squares at the corners of a square around the mech */}
        {WEAPON_SLOT_POS.map((pos, i) => {
          const w = equipped[i];
          return w ? (
            // Icon-only like the strip cards — the name lives in the
            // tooltip and the accessible label.
            <button
              key={w.id}
              type="button"
              aria-label={`Remove ${w.name} from weapon slots`}
              title={w.name}
              onClick={() => removeWeapon(w.id)}
              className={`absolute ${pos} h-24 w-24 overflow-hidden rounded-xl border-2 border-accent/70 bg-surface/80 backdrop-blur hover:border-fire/70`}
            >
              {(w.iconUrl ?? w.imageUrl) ? (
                <img
                  src={imageSrc(w.iconUrl ?? w.imageUrl!)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-black text-ink-dim">
                  {w.name.charAt(0)}
                </span>
              )}
            </button>
          ) : (
            <div
              key={`empty-weapon-${i}`}
              aria-label={`Empty weapon slot ${i + 1}`}
              className={`absolute ${pos} flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-edge bg-bg/40 text-lg text-ink-dim backdrop-blur-sm`}
            >
              +
            </div>
          );
        })}

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-black tracking-tight">
              {mech?.name ?? (detail.isPending ? "Loading…" : "This mech no longer exists")}
            </p>
            {mech?.epithet && <p className="text-sm text-ink-dim">{mech.epithet}</p>}
          </div>
          <button
            type="button"
            onClick={changeMech}
            className="min-h-11 rounded-lg border border-edge bg-surface/80 px-4 text-sm hover:border-accent/60"
          >
            Change mech
          </button>
        </div>
      </div>

      {/* weapon strip: filters + horizontal scroll, feeds the corner squares */}
      <h3 className="mt-5 mb-2 text-sm font-semibold">
        Weapons{" "}
        <span className="text-ink-dim">
          ({equipped.length}/{MAX_WEAPONS} — tap a square on the image to remove)
        </span>
      </h3>
      <div className="mb-2 grid gap-2 sm:grid-cols-3">
        <input
          aria-label="Filter weapons by name"
          value={weaponName}
          onChange={(e) => setWeaponName(e.target.value)}
          placeholder="Search weapons…"
          className={fieldCls}
        />
        <select
          aria-label="Filter weapons by type"
          value={weaponTypeId}
          onChange={(e) => setWeaponTypeId(e.target.value)}
          className={fieldCls}
        >
          <option value="">All types</option>
          {(types.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter weapons by tier"
          value={weaponTier}
          onChange={(e) => setWeaponTier(e.target.value as MechRank | "")}
          className={fieldCls}
        >
          <option value="">All tiers</option>
          <option value="Standard">Standard</option>
          <option value="S">S</option>
        </select>
      </div>
      {weapons.isPending ? (
        <p className="text-sm text-ink-dim">Loading weapons…</p>
      ) : filteredWeapons.length === 0 ? (
        <p className="text-sm text-ink-dim">No weapons match.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filteredWeapons.map((w) => {
            const isEquipped = weaponIds.includes(w.id);
            const art = w.iconUrl ?? w.imageUrl;
            return (
              // Icon-only by design; the name lives in the tooltip and the
              // accessible label so the card still reads as the weapon.
              <button
                key={w.id}
                type="button"
                aria-label={w.name}
                title={w.name}
                // Second click on an equipped card un-equips it.
                disabled={!isEquipped && weaponsFull}
                onClick={() => (isEquipped ? removeWeapon(w.id) : addWeapon(w.id))}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-edge bg-surface hover:border-accent/60 disabled:opacity-50"
              >
                {art ? (
                  <img src={imageSrc(art)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-black text-ink-dim">
                    {w.name.charAt(0)}
                  </span>
                )}
                {isEquipped && (
                  <span className="absolute right-1 top-1 rounded bg-bg/80 px-1 text-xs text-accent">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* one expandable skills block for the mech, one per equipped weapon */}
      <SkillsBlock
        title={mech ? `${mech.name} skills` : "Mech skills"}
        skills={skills}
        pickedIds={pickedIds}
        onPickedChange={setPickedIds}
        cardImageUrl={mech?.cardSkillIconUrl}
        defaultExpanded
        loading={detail.isPending}
      />
      {equipped.map((w) => (
        <SkillsBlock
          key={w.id}
          title={`${w.name} skills`}
          skills={w.skillNodes}
          pickedIds={weaponSkillIds[w.id] ?? []}
          onPickedChange={(ids) => setWeaponSkillIds((prev) => ({ ...prev, [w.id]: ids }))}
          cardImageUrl={w.iconUrl ?? w.imageUrl}
        />
      ))}

      {/* name + notes + save */}
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="build-name" className="mb-1 block text-sm font-semibold">
            Build name *
          </label>
          <input id="build-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label htmlFor="build-notes" className="mb-1 block text-sm font-semibold">Notes</label>
          <textarea
            id="build-notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
            placeholder="Strategy, rotation, why these skills…"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={name.trim() === "" || mech === undefined}
          className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          Save build
        </button>
      </div>
    </main>
  );
}
