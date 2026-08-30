import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  imageSrc,
  srcSet,
  CARD_SIZES,
  useDrones,
  useDroneTypes,
  useMech,
  useMechs,
  useModuleQualities,
  useModules,
  useTypes,
  useWeapons,
} from "../../api/client";
import type { DroneSelection, MechRank, ModuleSelection, PostedBuild, QualityTier, SkillNodeRow, WeaponSummary } from "../../api/types";
import { MAX_CORE_SLOTS, availableSkills, grantedSkills, resolvePicks } from "../../profile/buildRules";
import { STierIcon } from "../../components/STierIcon";
import { ButtonGroup } from "../../components/ButtonGroup";
import { PickedSlot, SkillsBlock } from "../../profile/SkillsBlock";
import { NotesField } from "../../profile/NotesField";
import { QualitySelect } from "../../profile/QualitySelect";
import { useMe } from "../../auth/useMe";
import { useCreateBuild, useMyBuilds, useUpdateBuild } from "../../auth/useBuilds";
import { RankBadge } from "../../components/RankBadge";
import { FilterBar } from "../../components/FilterBar";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { BuildModuleCard } from "./BuildModuleCard";
import { BuildDronesSection } from "./BuildDronesSection";

export const MAX_WEAPONS = 4;

// The 4 weapon squares sit at the corners of an invisible square centered
// on the mech art (layout chosen by the user from mockups).
const WEAPON_SLOT_POS = [
  "left-[8%] top-[14%]",
  "right-[8%] top-[14%]",
  "left-[8%] bottom-[14%]",
  "right-[8%] bottom-[14%]",
];

/** Thin shell that resolves the build to edit BEFORE mounting the real editor.
    Builds now live server-side, so in edit mode we wait for the owner's build
    list to load and hand the row down as a prop — that keeps the editor's lazy
    useState initializers (which seed every field from `existing`) working, the
    same way they did when the build was read synchronously from localStorage. */
export function BuildEditorPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const { buildId } = useParams<{ buildId: string }>();
  const myBuilds = useMyBuilds();

  const loading = "mx-auto max-w-6xl px-4 py-16 text-center text-ink-dim";
  if (isLoading) return <main className={loading}>Loading…</main>;
  // Editing requires the owner's build list; creating (no buildId) does not.
  if (buildId) {
    if (!isAuthenticated) return <Navigate to="/profile" replace />;
    if (myBuilds.isPending) return <main className={loading}>Loading…</main>;
  }
  const existing = buildId ? myBuilds.data?.find((b) => b.id === buildId) : undefined;
  // Remount when the target build changes so the initializers re-run.
  return <BuildEditorContent key={buildId ?? "new"} existing={existing} />;
}

/** Two-step build editor. Step 1 picks the SUBJECT: a mech (full build —
    8 skills + 4 weapons, each weapon with its own skills) or a single
    weapon (lean build — just that weapon's skills). One component for
    /new and /:buildId/edit — the route param decides. */
function BuildEditorContent({ existing }: { existing: PostedBuild | undefined }) {
  const { buildId } = useParams<{ buildId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const me = useMe();
  const createBuild = useCreateBuild();
  const updateBuild = useUpdateBuild();

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [mechId, setMechId] = useState<string | null>(existing?.mechId ?? null);
  // Set when this build is for a single weapon instead of a mech.
  const [buildWeaponId, setBuildWeaponId] = useState<string | null>(existing?.weaponId ?? null);
  const [pickedIds, setPickedIds] = useState<string[]>(existing?.skillIds ?? []);
  const [weaponIds, setWeaponIds] = useState<string[]>(existing?.weaponIds ?? []);
  // Per-weapon skill picks, keyed by weapon id — each block edits its slice.
  const [weaponSkillIds, setWeaponSkillIds] = useState<Record<string, string[]>>(
    existing?.weaponSkillIds ?? {}
  );
  // Quality tier of the SUBJECT (mech, or single weapon) + per equipped weapon.
  const [quality, setQuality] = useState<QualityTier>(existing?.quality ?? "Blue");
  const [weaponQualities, setWeaponQualities] = useState<Record<string, QualityTier>>(
    existing?.weaponQualities ?? {}
  );
  // Per-module picks (quality + up to 3 equipped effects), keyed by module id.
  const [moduleSel, setModuleSel] = useState<Record<string, ModuleSelection>>(
    existing?.moduleSelections ?? {}
  );
  // Per-drone-slot picks (drone + 0-9 quality gem), keyed by slot index "0".."5".
  const [droneSel, setDroneSel] = useState<Record<string, DroneSelection>>(
    existing?.droneSelections ?? {}
  );
  // Weapon strip filters — each one narrows the strip; blank = show all.
  const [weaponName, setWeaponName] = useState("");
  const [weaponTypeId, setWeaponTypeId] = useState("");
  const [weaponTier, setWeaponTier] = useState<MechRank | "">("");

  // Step-1 subject picker filters — the same FilterBar the browse page uses,
  // shared across both the mech grid and the single-weapon grid (mechs and
  // weapons share type + Standard/S, so one bar narrows both).
  const [pickTypeIds, setPickTypeIds] = useState<string[]>([]);
  const [pickRanks, setPickRanks] = useState<MechRank[]>([]);
  const [pickSearch, setPickSearch] = useState("");
  // Add/remove a value from its group's selection (empty group = no filter).
  const togglePick = <T,>(value: T, list: T[], set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const mechs = useMechs({});
  const detail = useMech(mechId ?? "");
  const weapons = useWeapons();
  const types = useTypes();
  const modules = useModules();
  const moduleQualities = useModuleQualities();
  const drones = useDrones();
  const droneTypes = useDroneTypes();
  const allWeapons = weapons.data ?? [];

  // Creating requires a logged-in user with a nickname (the author).
  if (buildId === undefined) {
    if (isLoading || (isAuthenticated && me.isPending)) {
      return <main className="mx-auto max-w-6xl px-4 py-16 text-center text-ink-dim">Loading…</main>;
    }
    if (!isAuthenticated) return <Navigate to="/profile" replace />;
    if ((me.data?.nickname ?? "").trim() === "") {
      return <Navigate to="/profile" replace state={{ needNickname: true }} />;
    }
  }

  if (buildId && !existing) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-ink-dim">Build not found.</p>
        <Link to="/profile" className="text-accent underline">Back to profile</Link>
      </main>
    );
  }

  // ----- step 1: pick the build's subject (mech or single weapon) -----
  if (mechId === null && buildWeaponId === null) {
    // Same client-side filtering as the browse page: OR within each group,
    // AND across groups, empty group = no filter. One search box matches a
    // mech's name/epithet or a weapon's name.
    const pq = pickSearch.trim().toLowerCase();
    const pickMechs = (mechs.data ?? []).filter((m) => {
      const typeOk = pickTypeIds.length === 0 || (m.type != null && pickTypeIds.includes(m.type.id));
      const rankOk = pickRanks.length === 0 || pickRanks.includes(m.rank);
      const searchOk =
        !pq || m.name.toLowerCase().includes(pq) || (m.epithet ?? "").toLowerCase().includes(pq);
      return typeOk && rankOk && searchOk;
    });
    const pickWeapons = allWeapons.filter((w) => {
      const typeOk = pickTypeIds.length === 0 || (w.type != null && pickTypeIds.includes(w.type.id));
      const tierOk = pickRanks.length === 0 || pickRanks.includes(w.tier);
      const searchOk = !pq || w.name.toLowerCase().includes(pq);
      return typeOk && tierOk && searchOk;
    });

    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/profile" className="text-sm text-ink-dim hover:text-accent">← My Profile</Link>

        <div className="mt-4">
          <FilterBar
            types={types.data ?? []}
            selectedTypeIds={pickTypeIds}
            selectedRanks={pickRanks}
            search={pickSearch}
            onToggleType={(id) => togglePick(id, pickTypeIds, setPickTypeIds)}
            onToggleRank={(r) => togglePick(r, pickRanks, setPickRanks)}
            onSearchChange={setPickSearch}
            onClear={() => {
              setPickTypeIds([]);
              setPickRanks([]);
            }}
            rankGroupLabel="rank / tier"
            searchPlaceholder="Search mechs & weapons..."
          />
        </div>

        <h2 className="mt-6 text-xl font-bold">Choose a mech</h2>
        {mechs.isPending ? (
          <LoadingSkeleton variant="cards" />
        ) : pickMechs.length === 0 ? (
          <p className="mt-4 text-sm text-ink-dim">No mechs match.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pickMechs.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMechId(m.id)}
                className="rounded-xl border cursor-pointer border-edge bg-surface p-4 text-left hover:border-accent/60"
              >
                {m.imageUrl && (
                  <img
                    src={imageSrc(m.imageUrl)}
                    srcSet={srcSet(m.imageUrl)}
                    sizes={CARD_SIZES}
                    alt=""
                    loading="lazy"
                    className="mb-2 h-48 w-full rounded-lg border border-edge object-cover"
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

        <h2 className="mt-8 text-xl font-bold">…or a build for a single weapon</h2>
        {weapons.isPending ? (
          <LoadingSkeleton variant="cards" />
        ) : pickWeapons.length === 0 ? (
          <p className="mt-4 text-sm text-ink-dim">No weapons match.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pickWeapons.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setBuildWeaponId(w.id)}
                className="rounded-xl border cursor-pointer border-edge bg-surface p-4 text-left hover:border-accent/60"
              >
                {(w.iconUrl ?? w.imageUrl) && (
                  <img
                    src={imageSrc(w.iconUrl ?? w.imageUrl!)}
                    srcSet={srcSet(w.iconUrl ?? w.imageUrl!)}
                    sizes={CARD_SIZES}
                    alt=""
                    loading="lazy"
                    className="mb-2 h-48 w-full rounded-lg border border-edge object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{w.name}</p>
                  <RankBadge rank={w.tier} />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  // ----- step 2: the build board -----
  const isWeaponBuild = buildWeaponId !== null;
  const buildWeapon = isWeaponBuild ? allWeapons.find((w) => w.id === buildWeaponId) : undefined;
  const mech = detail.data;
  // Skill pools filtered for THIS build: a LINKED skill only appears when its
  // gate partner is present — the mech pool is gated by the equipped weapon
  // ids; a weapon's pool is gated by the build's mech id.
  const skills = availableSkills(mech?.skillNodes ?? [], weaponIds);
  const buildWeaponSkills = availableSkills(
    buildWeapon ? buildWeapon.skillNodes : [],
    mechId ? [mechId] : []
  );
  const weaponPool = (wp: WeaponSummary) =>
    availableSkills(wp.skillNodes, mechId ? [mechId] : []);

  // Quality grants: nodes pre-granted at the owner's tier are removed from the
  // pickable pool and shown as "Initial". The subject uses `quality`; each
  // equipped weapon uses its own tier (default Blue).
  const withoutGranted = (pool: SkillNodeRow[], granted: SkillNodeRow[]) =>
    pool.filter((n) => !granted.some((g) => g.id === n.id));
  const mechGranted = grantedSkills(skills, quality);
  const mechPickable = withoutGranted(skills, mechGranted);
  const buildWeaponGranted = grantedSkills(buildWeaponSkills, quality);
  const buildWeaponPickable = withoutGranted(buildWeaponSkills, buildWeaponGranted);
  const weaponGranted = (wp: WeaponSummary) =>
    grantedSkills(weaponPool(wp), weaponQualities[wp.id] ?? "Blue");
  const weaponPickable = (wp: WeaponSummary) => withoutGranted(weaponPool(wp), weaponGranted(wp));

  // A linked skill's corner badge shows its gate partner's icon; this maps any
  // mech/weapon id in play to its icon (the partner is always in the build).
  const linkedIcons: Record<string, string | null> = {};
  for (const w of allWeapons) linkedIcons[w.id] = w.iconUrl;
  if (mech) linkedIcons[mech.id] = mech.iconUrl;

  // Equipped weapons resolved against the live list; a stored id whose
  // weapon was deleted from the wiki simply doesn't render.
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

  // The build-wide Core pool: core picks stay STORED with their source
  // block (mech skillIds / per-weapon weaponSkillIds), this just gathers
  // them for the shared section and the shared 3-cap.
  const corePool = isWeaponBuild
    ? resolvePicks(buildWeaponPickable, pickedIds, buildWeaponGranted)
      .filter((s) => s.type === "Core")
      .map((s) => ({
        skill: s,
        art: buildWeapon?.iconUrl ?? buildWeapon?.imageUrl,
        onRemove: () =>
          setPickedIds(
            resolvePicks(
              buildWeaponPickable,
              pickedIds.filter((id) => id !== s.id),
              buildWeaponGranted
            ).map((p) => p.id)
          ),
      }))
    : [
      ...resolvePicks(mechPickable, pickedIds, mechGranted)
        .filter((s) => s.type === "Core")
        .map((s) => ({
          skill: s,
          art: mech?.cardSkillIconUrl,
          onRemove: () =>
            setPickedIds(
              resolvePicks(mechPickable, pickedIds.filter((id) => id !== s.id), mechGranted).map(
                (p) => p.id
              )
            ),
        })),
      ...equipped.flatMap((w) =>
        resolvePicks(weaponPickable(w), weaponSkillIds[w.id] ?? [], weaponGranted(w))
          .filter((s) => s.type === "Core")
          .map((s) => ({
            skill: s,
            art: w.iconUrl ?? w.imageUrl,
            onRemove: () =>
              setWeaponSkillIds((prev) => ({
                ...prev,
                [w.id]: resolvePicks(
                  weaponPickable(w),
                  (prev[w.id] ?? []).filter((id) => id !== s.id),
                  weaponGranted(w)
                ).map((p) => p.id),
              })),
          }))
      ),
    ];

  // Shared "Core skills" section — 3 slots for the whole build.
  const coreSection = (
    <>
      <h3 className="mt-5 mb-2 text-sm font-semibold">
        Core skills{" "}
        <span className="text-ink-dim">
          ({corePool.length}/{MAX_CORE_SLOTS} — one pool for the whole build; pick them inside the
          skills blocks below)
        </span>
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: MAX_CORE_SLOTS }, (_, i) => {
          const entry = corePool[i];
          return entry ? (
            <PickedSlot
              key={entry.skill.id}
              skill={entry.skill}
              cardImageUrl={entry.art}
              onRemove={entry.onRemove}
              linkedIcons={linkedIcons}
            />
          ) : (
            <div
              key={`empty-core-${i}`}
              className="flex min-h-50 items-center justify-center rounded-xl border-2 border-dashed border-skill-core/60 text-xs text-ink-dim"
            >
              Core slot {i + 1}
            </div>
          );
        })}
      </div>
    </>
  );

  function changeWeapon() {
    setBuildWeaponId(null);
    setPickedIds([]);
  }

  const saving = createBuild.isPending || updateBuild.isPending;

  function save() {
    // Only prune stale ids once the live lists have loaded — saving during
    // a fetch must not silently drop equipment or picks.
    const subjectPickable = isWeaponBuild ? buildWeaponPickable : mechPickable;
    const subjectGranted = isWeaponBuild ? buildWeaponGranted : mechGranted;
    const savedWeaponIds = isWeaponBuild ? [] : weapons.data ? equipped.map((w) => w.id) : weaponIds;
    const input = {
      name: name.trim(),
      description: description.trim(),
      mechId: isWeaponBuild ? null : mechId,
      weaponId: buildWeaponId,
      skillIds: resolvePicks(subjectPickable, pickedIds, subjectGranted).map((p) => p.id),
      weaponIds: savedWeaponIds,
      quality,
      weaponQualities: isWeaponBuild
        ? {}
        : Object.fromEntries(savedWeaponIds.map((id) => [id, weaponQualities[id] ?? "Blue"])),
      moduleSelections: moduleSel,
      // Empty squares aren't stored — a cleared slot leaves no key behind.
      droneSelections: Object.fromEntries(
        Object.entries(droneSel).filter(([, s]) => s.droneId !== null)
      ),
      weaponSkillIds: isWeaponBuild
        ? {}
        : Object.fromEntries(
          savedWeaponIds.map((id) => {
            const w = allWeapons.find((x) => x.id === id);
            const ids = weaponSkillIds[id] ?? [];
            return [id, w ? resolvePicks(weaponPickable(w), ids, weaponGranted(w)).map((s) => s.id) : ids];
          })
        ),
    };
    const onSuccess = () => navigate("/profile");
    // Editing keeps the same row (and its status/hearts); creating makes a
    // new Draft the player can publish from their profile.
    if (existing) updateBuild.mutate({ id: existing.id, input }, { onSuccess });
    else createBuild.mutate(input, { onSuccess });
  }

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  // Name + notes — placed at the top of each board, beside the hero image.
  const nameNotes = (
    <div className="space-y-4">
      <div>
        <label htmlFor="build-name" className="mb-1 block text-sm font-semibold">
          Build name *
        </label>
        <input id="build-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} />
      </div>
      <div>
        <label htmlFor="build-notes" className="mb-1 block text-sm font-semibold">Notes</label>
        <NotesField
          id="build-notes"
          value={description}
          onChange={setDescription}
          mechs={mechs.data ?? []}
          weapons={allWeapons}
        />
      </div>
    </div>
  );

  // Shared tail of both boards: attack modules + save.
  const metaForm = (
    <div className="mt-6 space-y-4">
      <div>
        <h2 className="mb-2 text-lg font-black tracking-tight">Attack Module</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-start">
          {(modules.data ?? []).map((m) => (
            <BuildModuleCard
              key={m.id}
              module={m}
              types={types.data ?? []}
              qualities={moduleQualities.data ?? []}
              selection={moduleSel[m.id]}
              onChange={(next) => setModuleSel((s) => ({ ...s, [m.id]: next }))}
            />
          ))}
        </div>
      </div>
      <BuildDronesSection
        drones={drones.data ?? []}
        droneTypes={droneTypes.data ?? []}
        selections={droneSel}
        onChange={setDroneSel}
      />
      <button
        type="button"
        onClick={save}
        disabled={
          saving ||
          name.trim() === "" ||
          (isWeaponBuild ? buildWeapon === undefined : mech === undefined)
        }
        className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save build"}
      </button>
      {(createBuild.isError || updateBuild.isError) && (
        <p className="text-sm text-fire">
          {((createBuild.error ?? updateBuild.error) as Error).message}
        </p>
      )}
    </div>
  );

  // ----- weapon-only build: just the banner + that weapon's skills -----
  if (isWeaponBuild) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/profile" className="text-sm text-ink-dim hover:text-accent">← My Profile</Link>

        <div className="relative mt-3 h-[765px] overflow-hidden rounded-xl border border-edge bg-surface">
          {buildWeapon?.imageUrl && (
            <img src={imageSrc(buildWeapon.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
            <p className="text-2xl font-black tracking-tight">
              {buildWeapon?.name ?? (weapons.isPending ? "Loading…" : "This weapon no longer exists")}
            </p>
            <button
              type="button"
              onClick={changeWeapon}
              className="min-h-11 rounded-lg cursor-pointer border border-edge bg-surface/80 px-4 text-sm hover:border-accent/60"
            >
              Change weapon
            </button>
          </div>
        </div>

        <div className="mt-4">{nameNotes}</div>

        {coreSection}

        <QualitySelect label="Weapon quality" value={quality} onChange={setQuality} />

        <SkillsBlock
          title={buildWeapon ? `${buildWeapon.name} skills` : "Weapon skills"}
          skills={buildWeaponPickable}
          granted={buildWeaponGranted}
          pickedIds={pickedIds}
          onPickedChange={setPickedIds}
          cardImageUrl={buildWeapon?.iconUrl ?? buildWeapon?.imageUrl}
          defaultExpanded
          loading={weapons.isPending}
          globalCoreCount={corePool.length}
          linkedIcons={linkedIcons}
        />

        {metaForm}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/profile" className="text-sm text-ink-dim hover:text-accent">← My Profile</Link>

      {/* hero banner (mech art) + build meta (name/notes) side by side */}
      <div className="mt-3 md:flex md:items-start md:gap-4">
      <div className="relative h-[765px] max-w-full md:min-w-[369px] md:shrink-0 overflow-hidden rounded-xl border border-edge bg-surface">
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
            className="min-h-11 rounded-lg cursor-pointer border border-edge bg-surface/80 px-4 text-sm hover:border-accent/60"
          >
            Change mech
          </button>
        </div>
      </div>
        <div className="mt-4 md:mt-0 md:flex-1">{nameNotes}</div>
      </div>

      {/* weapon strip: filters + horizontal scroll, feeds the corner squares */}
      <h3 className="mt-5 mb-2 text-sm font-semibold">
        Weapons{" "}
        <span className="text-ink-dim">
          ({equipped.length}/{MAX_WEAPONS} — tap a square on the image to remove)
        </span>
      </h3>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          aria-label="Filter weapons by name"
          value={weaponName}
          onChange={(e) => setWeaponName(e.target.value)}
          placeholder="Search weapons…"
          className="min-h-11 w-3xs rounded-lg border border-edge bg-surface px-3 text-sm"
        />
        {/* Icon filters, same as the admin tables: empty = all; click the
            active one again to clear. */}
        <ButtonGroup
          ariaLabel="Filter weapons by type"
          labelPrefix="Type"
          iconOnly
          toggleable
          value={weaponTypeId}
          onChange={setWeaponTypeId}
          options={(types.data ?? []).map((t) => ({
            value: t.id,
            label: t.name,
            icon: t.iconUrl ? (
              <img src={imageSrc(t.iconUrl)} alt="" className="h-[32px] w-[32px] rounded-full object-cover" />
            ) : undefined,
          }))}
        />
        <ButtonGroup
          ariaLabel="Filter weapons by tier"
          labelPrefix="Tier"
          iconOnly
          toggleable
          value={weaponTier}
          onChange={(v) => setWeaponTier(v as MechRank | "")}
          options={[
            { value: "Standard", label: "Standard" },
            { value: "S", label: "S", icon: <STierIcon size={25} /> },
          ]}
        />
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
                  <img
                    src={imageSrc(art)}
                    srcSet={srcSet(art)}
                    sizes="80px"
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
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

      {coreSection}

      {/* one expandable skills block for the mech, one per equipped weapon */}
      <QualitySelect label="Mech quality" value={quality} onChange={setQuality} />
      <SkillsBlock
        title={mech ? `${mech.name} skills` : "Mech skills"}
        skills={mechPickable}
        granted={mechGranted}
        pickedIds={pickedIds}
        onPickedChange={setPickedIds}
        cardImageUrl={mech?.cardSkillIconUrl}
        defaultExpanded
        loading={detail.isPending}
        globalCoreCount={corePool.length}
        linkedIcons={linkedIcons}
      />
      {equipped.map((w) => (
        <div key={w.id}>
          <QualitySelect
            label={`${w.name} quality`}
            value={weaponQualities[w.id] ?? "Blue"}
            onChange={(t) => setWeaponQualities((prev) => ({ ...prev, [w.id]: t }))}
          />
          <SkillsBlock
            title={`${w.name} skills`}
            skills={weaponPickable(w)}
            granted={weaponGranted(w)}
            pickedIds={weaponSkillIds[w.id] ?? []}
            onPickedChange={(ids) => setWeaponSkillIds((prev) => ({ ...prev, [w.id]: ids }))}
            cardImageUrl={w.iconUrl ?? w.imageUrl}
            globalCoreCount={corePool.length}
            linkedIcons={linkedIcons}
          />
        </div>
      ))}

      {metaForm}
    </main>
  );
}
