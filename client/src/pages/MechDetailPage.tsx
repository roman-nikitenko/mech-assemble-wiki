import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { imageSrc, NotFoundError, useMech } from "../api/client";
import { Tabs } from "../components/Tabs";
import { TypeBadge } from "../components/TypeBadge";
import { RankBadge } from "../components/RankBadge";
import { STierIcon } from "../components/STierIcon";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { LinkedRow } from "../components/LinkedRow";
import { Seo } from "../components/Seo";
import { ErrorPanel } from "../components/ErrorPanel";
import { mechSummary } from "../lib/mechSummary";
import { OverviewTab } from "./sections/OverviewTab";
import { SkillsTab } from "./sections/SkillsTab";
import { AwakenTab } from "./sections/AwakenTab";
import { SkinsHelpersTab } from "./sections/SkinsHelpersTab";
import { SsViewTab } from "./sections/SsViewTab";

// Shown as the SS art, not as text; this is its accessible name.
const SS_TAB = "SS 3D view";

export function MechDetailPage() {
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
  const ssViewerUrl = mech.rank === "S" ? mech.ssViewerUrl : null;
  const tabs = [
    "Overview",
    "Skills",
    ...(mech.awakeningLevels.length > 0 ? ["Awaken"] : []),
    ...(mech.skins.length + mech.helpers.length > 0 ? ["Skin"] : []),
    ...(ssViewerUrl ? [SS_TAB] : []),
  ];
  // The chosen tab survives navigating to another mech, which may not have it.
  const shownTab = tabs.includes(activeTab) ? activeTab : "Overview";

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Seo
        title={`${mech.name} — Skills, Build & Awakening | Mech Assemble Wiki`}
        // Same text the server injects (server/src/lib/mechSummary.ts), so the
        // description a crawler sees does not change once the JS runs.
        description={mechSummary(mech)}
        path={`/mechs/${mech.slug ?? mech.id}`}
        image={mech.imageUrl ? imageSrc(mech.imageUrl) : undefined}
      />
      <Link to="/" className="text-sm text-ink-dim hover:text-accent">
        ← All mechs
      </Link>

      <header className="mt-3 mb-5 flex flex-col sm:flex-row gap-5">
        {mech.imageUrl && (
          <img
            src={imageSrc(mech.imageUrl)}
            alt={mech.name}
            className="mb-4 h-48 w-48 rounded-xl border bg-surface border-edge object-cover"
          />
        )}
        <div className="">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">{mech.name}</h1>
            <RankBadge rank={mech.rank} />
            {mech.type && <TypeBadge type={mech.type} />}
          </div>
          {mech.epithet && <p className="mt-1 text-ink-dim">{mech.epithet}</p>}
          <p className="mt-3 text-sm leading-relaxed text-ink-dim">{mechSummary(mech)}</p>
          <div className="mt-3 flex flex-col flex-wrap gap-x-4 gap-y-1 text-sm text-ink-dim">
            {mech.specialBonus && (
              <span>
                Bonus: <span className="text-accent font-black">{mech.specialBonus}</span>
              </span>
            )}
          </div>
          {mech.pilot && (
            <div className="mt-3">
              <LinkedRow
                to={`/pilots#pilot-${mech.pilot.id}`}
                iconUrl={mech.pilot.iconUrl}
                name={mech.pilot.name}
                bonus={mech.pilot.relationshipBonus}
              />
            </div>
          )}
        </div>

      </header>

      <Tabs
        tabs={tabs}
        active={shownTab}
        onChange={setActiveTab}
        icons={{ [SS_TAB]: <STierIcon variant="SS" size={32} /> }}
      />
      <div className="py-4">
        {shownTab === "Overview" && <OverviewTab mech={mech} />}
        {shownTab === "Skills" && <SkillsTab nodes={mech.skillNodes} />}
        {shownTab === "Awaken" && <AwakenTab levels={mech.awakeningLevels} />}
        {shownTab === "Skin" && (
          <SkinsHelpersTab skins={mech.skins} helpers={mech.helpers} />
        )}
        {shownTab === SS_TAB && ssViewerUrl && <SsViewTab mechName={mech.name} url={ssViewerUrl} />}
      </div>
    </main>
  );
}
