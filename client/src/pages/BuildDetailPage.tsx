import { Link, useParams } from "react-router-dom";
import { imageSrc, useDrones, useDroneTypes, useMech, useMechs, useModuleQualities, useModules, usePostedBuild, useTypes, useWeapons } from "../api/client";
import { BuildModuleCard } from "./profile/BuildModuleCard";
import { BuildDronesSection } from "./profile/BuildDronesSection";
import type { WeaponSummary } from "../api/types";
import { Seo } from "../components/Seo";
import { AuthorTag } from "../profile/AuthorTag";
import { availableSkills, grantedSkills, resolvePicks } from "../profile/buildRules";
import { PickedSlot } from "../profile/SkillsBlock";
import { NotePreview } from "../profile/NotePreview";
import { formatDate } from "../lib/date";
import { ShareButton } from "../profile/ShareButton";

// Same corner layout as the editor's banner, read-only.
const WEAPON_SLOT_POS = [
  "left-[8%] top-[14%]",
  "right-[8%] top-[14%]",
  "left-[8%] bottom-[14%]",
  "right-[8%] bottom-[14%]",
];

function SkillGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">{children}</div>;
}

/** Public, read-only view of one posted build. Fetches from /api/builds/:id. */
export function BuildDetailPage() {
  const { buildId } = useParams<{ buildId: string }>();
  const build = usePostedBuild(buildId ?? "");
  const mechs = useMechs({});
  const detail = useMech(build.data?.mechId ?? "");
  const weapons = useWeapons();
  const allWeapons = weapons.data ?? [];
  const modules = useModules();
  const moduleQualities = useModuleQualities();
  const types = useTypes();
  const drones = useDrones();
  const droneTypes = useDroneTypes();

  if (build.isPending) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-ink-dim">Loading…</main>
    );
  }

  if (!build.data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-ink-dim">Build not found.</p>
        <Link to="/builds" className="text-accent underline">Back to builds</Link>
      </main>
    );
  }

  const b = build.data;
  const isWeaponBuild = b.weaponId !== null;
  const buildWeapon = isWeaponBuild ? allWeapons.find((w) => w.id === b.weaponId) : undefined;
  const mech = detail.data;

  // A linked skill's corner badge shows its gate partner's icon; map any
  // mech/weapon id in play to its icon.
  const linkedIcons: Record<string, string | null> = {};
  for (const w of allWeapons) linkedIcons[w.id] = w.iconUrl;
  if (mech) linkedIcons[mech.id] = mech.iconUrl;

  // Filter LINKED skills by whether their gate partner is in the build: the
  // mech pool is gated by the equipped weapon ids, a weapon's pool by the mech.
  const mechPool = availableSkills(mech?.skillNodes ?? [], b.weaponIds);
  const subjectSkills = isWeaponBuild
    ? availableSkills(buildWeapon?.skillNodes ?? [], b.mechId ? [b.mechId] : [])
    : mechPool;
  const subjectArt = isWeaponBuild
    ? (buildWeapon?.iconUrl ?? buildWeapon?.imageUrl)
    : mech?.cardSkillIconUrl;
  // Nodes pre-granted by the subject's quality tier (active from the start).
  const subjectGranted = grantedSkills(subjectSkills, b.quality);
  const subjectPicks = resolvePicks(subjectSkills, b.skillIds, subjectGranted);
  const subjectRegular = subjectPicks.filter((s) => s.type !== "Core");

  const equipped = b.weaponIds
    .map((id) => allWeapons.find((w) => w.id === id))
    .filter((w): w is WeaponSummary => w !== undefined);
  const weaponPicks = equipped.map((w) => {
    const pool = availableSkills(w.skillNodes, b.mechId ? [b.mechId] : []);
    const granted = grantedSkills(pool, b.weaponQualities[w.id] ?? "Blue");
    return {
      weapon: w,
      granted,
      picks: resolvePicks(pool, b.weaponSkillIds[w.id] ?? [], granted),
    };
  });

  const corePool = [
    ...subjectPicks
      .filter((s) => s.type === "Core")
      .map((s) => ({ skill: s, art: subjectArt })),
    ...weaponPicks.flatMap(({ weapon, picks }) =>
      picks
        .filter((s) => s.type === "Core")
        .map((s) => ({ skill: s, art: weapon.iconUrl ?? weapon.imageUrl }))
    ),
  ];

  const bannerImage = isWeaponBuild ? buildWeapon?.imageUrl : mech?.imageUrl;
  const subjectName = isWeaponBuild ? buildWeapon?.name : mech?.name;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title={`Mech Assemble Wiki — "${b.name}"`}
        description={b.description.trim() || undefined}
        path={`/builds/${b.id}`}
        image={
          isWeaponBuild
            ? buildWeapon?.imageUrl
              ? imageSrc(buildWeapon.imageUrl)
              : undefined
            : mech?.imageUrl
              ? imageSrc(mech.imageUrl)
              : undefined
        }
      />
      <Link to="/builds" className="text-sm text-ink-dim hover:text-accent">← All builds</Link>
      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-4 md:gap-8">
        <div className="relative mt-3 h-96 overflow-hidden rounded-xl border border-edge bg-surface">
          {bannerImage && (
            <img src={imageSrc(bannerImage)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          {!isWeaponBuild &&
            equipped.map((w, i) => (
              <div
                key={w.id}
                title={w.name}
                className={`absolute ${WEAPON_SLOT_POS[i]} h-20 w-20 overflow-hidden rounded-xl border-2 border-accent/70 bg-surface/80 backdrop-blur`}
              >
                {(w.iconUrl ?? w.imageUrl) ? (
                  <img src={imageSrc(w.iconUrl ?? w.imageUrl!)} alt={w.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-black text-ink-dim">
                    {w.name.charAt(0)}
                  </span>
                )}
              </div>
            ))}
          <p className="absolute bottom-3 left-4 text-lg font-bold text-ink-dim">{subjectName}</p>
        </div>

        <div className="">
          <div className="mt-4 flex items-center justify-between gap-2">
            <h1 className="text-3xl font-black tracking-tight">{b.name}</h1>
            <ShareButton buildId={b.id} />
          </div>
          <p className="mt-1 text-sm text-ink-dim">
            by <AuthorTag nickname={b.author.nickname} server={b.author.server} /> · updated{" "}
            {formatDate(b.updatedAt)}
          </p>
          {b.description.trim() !== "" && (
            <div className="mt-8 max-w-3xl">
              <NotePreview text={b.description} mechs={mechs.data ?? []} weapons={allWeapons} />
            </div>
          )}
        </div>

      </div>




      {corePool.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-2xl font-semibold">Core skills</h2>
          <SkillGrid>
            {corePool.map(({ skill, art }) => (
              <PickedSlot key={skill.id} skill={skill} cardImageUrl={art} linkedIcons={linkedIcons} />
            ))}
          </SkillGrid>
        </>
      )}

      {subjectGranted.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-2xl font-semibold">
            {subjectName} initial <span className="text-ink-dim">(from quality)</span>
          </h2>
          <SkillGrid>
            {subjectGranted.map((skill) => (
              <PickedSlot key={`sgrant-${skill.id}`} skill={skill} cardImageUrl={subjectArt} linkedIcons={linkedIcons} initial />
            ))}
          </SkillGrid>
        </>
      )}

      {subjectRegular.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-2xl font-semibold">{subjectName} skills</h2>
          <SkillGrid>
            {/* Keyed by position, not id — a repeatable skill can appear
                more than once in the same list. */}
            {subjectRegular.map((skill, i) => (
              <PickedSlot key={`subject-${i}`} skill={skill} cardImageUrl={subjectArt} linkedIcons={linkedIcons} />
            ))}
          </SkillGrid>
        </>
      )}

      {weaponPicks.map(({ weapon, picks, granted }) => {
        const regular = picks.filter((s) => s.type !== "Core");
        if (regular.length === 0 && granted.length === 0) return null;
        return (
          <div className="flex flex-col gap-2" key={weapon.id}>
            <h2 className="mt-6 mb-2 text-2xl font-semibold">{weapon.name} skills</h2>
            {granted.length > 0 && (
              <SkillGrid>
                {granted.map((skill) => (
                  <PickedSlot
                    key={`${weapon.id}-grant-${skill.id}`}
                    skill={skill}
                    cardImageUrl={weapon.iconUrl ?? weapon.imageUrl}
                    linkedIcons={linkedIcons}
                    initial
                  />
                ))}
              </SkillGrid>
            )}
            <SkillGrid>
              {/* Positional keys — a repeatable skill may occupy two slots. */}
              {regular.map((skill, i) => (
                <PickedSlot
                  key={`${weapon.id}-${i}`}
                  skill={skill}
                  cardImageUrl={weapon.iconUrl ?? weapon.imageUrl}
                  linkedIcons={linkedIcons}
                />
              ))}
            </SkillGrid>
          </div>
        );
      })}

      {(modules.data ?? []).length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-2xl font-black tracking-tight">Attack Module</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-start">
            {(modules.data ?? []).map((m) => (
              <BuildModuleCard
                key={m.id}
                module={m}
                types={types.data ?? []}
                qualities={moduleQualities.data ?? []}
                selection={b.moduleSelections[m.id]}
                readOnly
              />
            ))}
          </div>
        </>
      )}

      {/* Only worth showing once the author actually equipped a drone — an
          all-empty 6-square grid is noise on a public build page. */}
      {Object.values(b.droneSelections ?? {}).some((s) => s.droneId !== null) && (
        <div className="mt-6">
          <BuildDronesSection
            drones={drones.data ?? []}
            droneTypes={droneTypes.data ?? []}
            selections={b.droneSelections ?? {}}
            readOnly
          />
        </div>
      )}
    </main>
  );
}
