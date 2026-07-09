import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { imageSrc, NotFoundError, useMech } from "../api/client";
import { Tabs } from "../components/Tabs";
import { TypeBadge } from "../components/TypeBadge";
import { RankBadge } from "../components/RankBadge";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { OverviewTab } from "./sections/OverviewTab";
import { SkillsTab } from "./sections/SkillsTab";
import { WeaponTab } from "./sections/WeaponTab";
import { AwakenTab } from "./sections/AwakenTab";
import { SkinsHelpersTab } from "./sections/SkinsHelpersTab";

export function MechDetailPage() {
  // The route is /mechs/:id, so id is always present; "!" tells TS that.
  const { id } = useParams<{ id: string }>();
  const { data: mech, isPending, isError, error, refetch } = useMech(id!);
  const [activeTab, setActiveTab] = useState("Overview");

  if (isPending) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <LoadingSkeleton variant="detail" />
      </main>
    );
  }

  if (isError && error instanceof NotFoundError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Mech not found</h1>
        <Link to="/" className="mt-2 inline-block text-accent underline">
          Back to browse
        </Link>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <ErrorPanel onRetry={() => refetch()} />
      </main>
    );
  }

  // Tabs are driven by DATA, not by rank: a Standard mech simply has no
  // weapon/awakening/skins, so those tabs never appear for it. (Rank gates
  // the data at seed time; data gates the tabs here.)
  const tabs = [
    "Overview",
    "Skills",
    ...(mech.weapon ? ["Weapon"] : []),
    ...(mech.awakeningLevels.length > 0 ? ["Awaken"] : []),
    ...(mech.skins.length + mech.helpers.length > 0 ? ["Skins & Helpers"] : []),
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/" className="text-sm text-ink-dim hover:text-accent">
        ← All mechs
      </Link>

      <header className="mt-3 mb-5">
        {mech.imageUrl && (
          <img
            src={imageSrc(mech.imageUrl)}
            alt={mech.name}
            className="mb-4 h-48 w-48 rounded-xl border border-edge object-cover"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">{mech.name}</h1>
          <RankBadge rank={mech.rank} />
          <TypeBadge type={mech.type} />
        </div>
        {mech.epithet && <p className="mt-1 text-ink-dim">{mech.epithet}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-dim">
          {mech.quality && (
            <span>
              Quality: <span className="text-ink">{mech.quality}</span>
            </span>
          )}
          {mech.pilotName && (
            <span>
              Pilot: <span className="text-ink">{mech.pilotName}</span>
            </span>
          )}
          {mech.specialBonus && (
            <span>
              Bonus: <span className="text-accent">{mech.specialBonus}</span>
            </span>
          )}
        </div>
      </header>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="py-4">
        {activeTab === "Overview" && <OverviewTab mech={mech} />}
        {activeTab === "Skills" && <SkillsTab skills={mech.skills} />}
        {activeTab === "Weapon" && mech.weapon && <WeaponTab weapon={mech.weapon} />}
        {activeTab === "Awaken" && <AwakenTab levels={mech.awakeningLevels} />}
        {activeTab === "Skins & Helpers" && (
          <SkinsHelpersTab skins={mech.skins} helpers={mech.helpers} />
        )}
      </div>
    </main>
  );
}
