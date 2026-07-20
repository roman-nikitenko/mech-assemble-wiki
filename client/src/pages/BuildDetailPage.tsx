import { Link, useParams } from "react-router-dom";
import { imageSrc, useMech, useMechs, usePostedBuild, useWeapons } from "../api/client";
import type { WeaponSummary } from "../api/types";
import { AuthorTag } from "../profile/AuthorTag";
import { resolvePicks } from "../profile/buildRules";
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

  const subjectSkills = isWeaponBuild ? (buildWeapon?.skillNodes ?? []) : (mech?.skillNodes ?? []);
  const subjectArt = isWeaponBuild
    ? (buildWeapon?.iconUrl ?? buildWeapon?.imageUrl)
    : mech?.cardSkillIconUrl;
  const subjectPicks = resolvePicks(subjectSkills, b.skillIds);
  const subjectRegular = subjectPicks.filter((s) => s.type !== "Core");

  const equipped = b.weaponIds
    .map((id) => allWeapons.find((w) => w.id === id))
    .filter((w): w is WeaponSummary => w !== undefined);
  const weaponPicks = equipped.map((w) => ({
    weapon: w,
    picks: resolvePicks(w.skillNodes, b.weaponSkillIds[w.id] ?? []),
  }));

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
      <Link to="/builds" className="text-sm text-ink-dim hover:text-accent">← All builds</Link>

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

      <div className="mt-4 flex items-center justify-between gap-2">
        <h1 className="text-3xl font-black tracking-tight">{b.name}</h1>
        <ShareButton buildId={b.id} />
      </div>
      <p className="mt-1 text-sm text-ink-dim">
        by <AuthorTag nickname={b.author.nickname} server={b.author.server} /> · updated{" "}
        {formatDate(b.updatedAt)}
      </p>

      {corePool.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold">Core skills</h2>
          <SkillGrid>
            {corePool.map(({ skill, art }) => (
              <PickedSlot key={skill.id} skill={skill} cardImageUrl={art} />
            ))}
          </SkillGrid>
        </>
      )}

      {subjectRegular.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold">{subjectName} skills</h2>
          <SkillGrid>
            {subjectRegular.map((skill) => (
              <PickedSlot key={skill.id} skill={skill} cardImageUrl={subjectArt} />
            ))}
          </SkillGrid>
        </>
      )}

      {weaponPicks.map(({ weapon, picks }) => {
        const regular = picks.filter((s) => s.type !== "Core");
        if (regular.length === 0) return null;
        return (
          <div key={weapon.id}>
            <h2 className="mt-6 mb-2 text-sm font-semibold">{weapon.name} skills</h2>
            <SkillGrid>
              {regular.map((skill) => (
                <PickedSlot
                  key={skill.id}
                  skill={skill}
                  cardImageUrl={weapon.iconUrl ?? weapon.imageUrl}
                />
              ))}
            </SkillGrid>
          </div>
        );
      })}

      {b.description.trim() !== "" && (
        <div className="mt-8 max-w-3xl rounded-xl border border-edge bg-surface p-5">
          <NotePreview text={b.description} mechs={mechs.data ?? []} weapons={allWeapons} />
        </div>
      )}
    </main>
  );
}
