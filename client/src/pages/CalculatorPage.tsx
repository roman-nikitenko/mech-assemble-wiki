import { useLocation, useNavigate } from "react-router-dom";
import { useMech, useMechs, useWeapons, imageSrc } from "../api/client";
import type { MechSummary, QualityTier, SkillNodeRow, WeaponSummary } from "../api/types";
import { availableSkills, grantedSkills, resolvePicks, MAX_CORE_SLOTS } from "../profile/buildRules";
import { PickedSlot, SkillsBlock } from "../profile/SkillsBlock";
import { QualitySelect } from "../profile/QualitySelect";
import { decodeCalcLink, encodeCalcLink, EMPTY_CALC_LINK, type CalcLink, type CalcOwner } from "../calculator/calcLink";
import { idsToKeys, keysToIds } from "../calculator/calcResolve";
import { Seo } from "../components/Seo";

export const MAX_WEAPONS = 4;

export function CalculatorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // The URL is the single source of truth. Every edit rewrites it; nothing is
  // mirrored in component state, so a shared link and a link you just built by
  // clicking are literally the same thing.
  const link = decodeCalcLink(location.search);

  // navigate({ search }) — NOT setSearchParams. React Router concatenates the
  // string as-is, so ":" and "," stay literal; setSearchParams would escape
  // them to %3A/%2C and add ~90 chars to a full build.
  function updateLink(next: CalcLink) {
    navigate({ search: encodeCalcLink(next) });
  }

  // Owners are keyed by SLUG, not id — the share link is written in slugs, so
  // keying state the same way makes the URL sync a straight copy.
  const mechSlug = link.mech?.slug ?? null;
  const quality: QualityTier = link.mech?.tier ?? "Blue";
  const weaponSlugs = link.weapons.map((w) => w.slug);
  const weaponOwner = (slug: string): CalcOwner | undefined =>
    link.weapons.find((w) => w.slug === slug);

  function setQuality(tier: QualityTier) {
    if (!link.mech) return;
    updateLink({ ...link, mech: { ...link.mech, tier } });
  }

  function setWeaponQuality(slug: string, tier: QualityTier) {
    updateLink({
      ...link,
      weapons: link.weapons.map((w) => (w.slug === slug ? { ...w, tier } : w)),
    });
  }

  const mechList = useMechs({});
  const detail = useMech(mechSlug ?? "");
  const weaponList = useWeapons();

  const mech = detail.data;
  const allWeapons: WeaponSummary[] = weaponList.data ?? [];
  const equipped = weaponSlugs
    .map((slug) => allWeapons.find((w) => w.slug === slug))
    .filter((w): w is WeaponSummary => w !== undefined);
  const equippedIds = equipped.map((w) => w.id);

  // Same gating as the build editor: a LINKED skill only appears when its gate
  // partner is present — equipped weapons for the mech's pool, the mech for a
  // weapon's pool.
  const mechSkills = availableSkills(mech?.skillNodes ?? [], equippedIds);
  const weaponPool = (w: WeaponSummary) =>
    availableSkills(w.skillNodes, mech ? [mech.id] : []);

  // Quality grants: nodes pre-granted at the owner's tier leave the pickable
  // pool and show as "Initial", but still satisfy parent and level gates.
  const withoutGranted = (pool: SkillNodeRow[], granted: SkillNodeRow[]) =>
    pool.filter((n) => !granted.some((g) => g.id === n.id));
  const mechGranted = grantedSkills(mechSkills, quality);
  const mechPickable = withoutGranted(mechSkills, mechGranted);
  const weaponGranted = (w: WeaponSummary) =>
    grantedSkills(weaponPool(w), weaponOwner(w.slug ?? "")?.tier ?? "Blue");
  const weaponPickable = (w: WeaponSummary) => withoutGranted(weaponPool(w), weaponGranted(w));

  // Keys resolve against the owner's FULL available pool, not the pickable one:
  // a node pre-granted by the tier is absent from `*Pickable`, and resolving
  // there would report it as missing and show a false link-rot warning.
  const mechResolved = keysToIds(mechSkills, link.mech?.picks ?? []);
  const weaponResolved = new Map(
    equipped.map((w) => [
      w.slug ?? "",
      keysToIds(weaponPool(w), weaponOwner(w.slug ?? "")?.picks ?? []),
    ])
  );

  const mechPickIds = mechResolved.ids;
  const weaponPickIds = (slug: string) => weaponResolved.get(slug)?.ids ?? [];

  // Only meaningful once the pools have loaded — before that everything looks
  // "missing" simply because there is nothing to match against yet.
  const dataReady = !detail.isPending && !weaponList.isPending;
  const missingCount = dataReady
    ? mechResolved.missing + [...weaponResolved.values()].reduce((n, r) => n + r.missing, 0)
    : 0;

  function setMechPickIds(ids: string[]) {
    if (!link.mech) return;
    updateLink({ ...link, mech: { ...link.mech, picks: idsToKeys(ids) } });
  }

  function setWeaponPickIds(slug: string, ids: string[]) {
    updateLink({
      ...link,
      weapons: link.weapons.map((w) => (w.slug === slug ? { ...w, picks: idsToKeys(ids) } : w)),
    });
  }

  const linkedIcons: Record<string, string | null> = {};
  for (const w of allWeapons) linkedIcons[w.id] = w.iconUrl;
  if (mech) linkedIcons[mech.id] = mech.iconUrl;

  // Core picks are capped BUILD-WIDE at 3, across the mech and every weapon.
  const mechCore = resolvePicks(mechPickable, mechPickIds, mechGranted)
    .filter((s) => s.type === "Core");
  const weaponCore = equipped.flatMap((w) =>
    resolvePicks(weaponPickable(w), weaponPickIds(w.slug ?? ""), weaponGranted(w))
      .filter((s) => s.type === "Core")
  );
  const corePool = [...mechCore, ...weaponCore];

  function chooseMech(m: MechSummary) {
    if (!m.slug) return; // an unslugged mech can't appear in a share link
    // Choosing a mech resets everything — picks belong to the old mech's tree.
    updateLink({ mech: { slug: m.slug, tier: "Blue", picks: [] }, weapons: [] });
  }

  function toggleWeapon(w: WeaponSummary) {
    const slug = w.slug;
    if (!slug) return;
    const equippedAlready = link.weapons.some((x) => x.slug === slug);
    if (equippedAlready) {
      updateLink({ ...link, weapons: link.weapons.filter((x) => x.slug !== slug) });
    } else if (link.weapons.length < MAX_WEAPONS) {
      updateLink({ ...link, weapons: [...link.weapons, { slug, tier: "Blue", picks: [] }] });
    }
  }

  if (!mechSlug) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Seo
          title="Skill Calculator — Mech Assemble Wiki"
          description="Plan a mech's skills and weapon skills, then share the exact setup as a link."
          path="/calculator"
        />
        <h1 className="text-2xl font-black tracking-tight">Skill Calculator</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Pick a mech, equip weapons, choose skills — then share the link.
        </p>
        <h2 className="mt-6 text-xl font-bold">Choose a mech</h2>
        {mechList.isPending ? (
          <p className="mt-2 text-sm text-ink-dim">Loading mechs…</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {(mechList.data ?? []).map((m) => (
              <button
                key={m.id}
                type="button"
                aria-label={m.name}
                title={m.name}
                onClick={() => chooseMech(m)}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-edge bg-surface hover:border-accent/60"
              >
                {m.imageUrl ? (
                  <img src={imageSrc(m.imageUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-black text-ink-dim">
                    {m.name.charAt(0)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Skill Calculator — Mech Assemble Wiki"
        description="Plan a mech's skills and weapon skills, then share the exact setup as a link."
        path="/calculator"
      />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">
          {mech ? mech.name : "Skill Calculator"}
        </h1>
        <button
          type="button"
          onClick={() => updateLink(EMPTY_CALC_LINK)}
          className="rounded-lg border border-accent px-2 py-1 text-sm"
        >
          Change mech
        </button>
      </div>

      {missingCount > 0 && (
        <p
          role="status"
          className="mt-3 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink-dim"
        >
          {missingCount} {missingCount === 1 ? "skill" : "skills"} in this link no longer
          exist and {missingCount === 1 ? "was" : "were"} skipped — the wiki changed since
          it was shared.
        </p>
      )}

      <h2 className="mt-6 text-lg font-bold">
        Weapons ({weaponSlugs.length}/{MAX_WEAPONS})
      </h2>
      {weaponList.isPending ? (
        <p className="text-sm text-ink-dim">Loading weapons…</p>
      ) : (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {allWeapons.map((w) => {
            const isEquipped = w.slug !== null && weaponSlugs.includes(w.slug);
            const art = w.iconUrl ?? w.imageUrl;
            return (
              <button
                key={w.id}
                type="button"
                aria-label={w.name}
                title={w.name}
                disabled={!isEquipped && weaponSlugs.length >= MAX_WEAPONS}
                onClick={() => toggleWeapon(w)}
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

      {/* Build-wide Core skills — one pool of 3 across the mech and all weapons. */}
      <h2 className="mt-6 text-lg font-black tracking-tight">
        Core skills ({corePool.length}/{MAX_CORE_SLOTS})
      </h2>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {Array.from({ length: MAX_CORE_SLOTS }, (_, i) => {
          const entry = corePool[i];
          return entry ? (
            <PickedSlot key={entry.id} skill={entry} linkedIcons={linkedIcons} />
          ) : (
            <div
              key={`empty-${i}`}
              className="flex min-h-50 items-center justify-center rounded-xl border-2 border-dashed border-edge text-xs text-ink-dim"
            >
              empty
            </div>
          );
        })}
      </div>

      <QualitySelect label="Mech quality" value={quality} onChange={setQuality} />
      <SkillsBlock
        title={mech ? `${mech.name} skills` : "Mech skills"}
        skills={mechPickable}
        granted={mechGranted}
        pickedIds={mechPickIds}
        onPickedChange={setMechPickIds}
        cardImageUrl={mech?.cardSkillIconUrl}
        defaultExpanded
        loading={detail.isPending}
        globalCoreCount={corePool.length}
        linkedIcons={linkedIcons}
      />

      {equipped.map((w) => {
        const slug = w.slug ?? "";
        return (
          <div key={w.id}>
            <QualitySelect
              label={`${w.name} quality`}
              value={weaponOwner(slug)?.tier ?? "Blue"}
              onChange={(t) => setWeaponQuality(slug, t)}
            />
            <SkillsBlock
              title={`${w.name} skills`}
              skills={weaponPickable(w)}
              granted={weaponGranted(w)}
              pickedIds={weaponPickIds(slug)}
              onPickedChange={(ids) => setWeaponPickIds(slug, ids)}
              cardImageUrl={w.iconUrl ?? w.imageUrl}
              globalCoreCount={corePool.length}
              linkedIcons={linkedIcons}
            />
          </div>
        );
      })}
    </main>
  );
}
