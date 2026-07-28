import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { imageSrc, NotFoundError, useWeapon } from "../api/client";
import { Tabs } from "../components/Tabs";
import { TypeBadge } from "../components/TypeBadge";
import { RankBadge } from "../components/RankBadge";
import { WeaponSkins, WeaponHelpers } from "../components/WeaponKit";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorPanel } from "../components/ErrorPanel";
import { WeaponOverviewTab } from "./sections/WeaponOverviewTab";
import { SkillsTab } from "./sections/SkillsTab";

export function WeaponDetailPage() {
  // The route is /weapons/:id, so id is always present; "!" tells TS that.
  const { id } = useParams<{ id: string }>();
  const { data: weapon, isPending, isError, error, refetch } = useWeapon(id!);
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
        <h1 className="text-xl font-bold">Weapon not found</h1>
        <Link to="/weapons" className="mt-2 inline-block text-accent underline">
          All weapons
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

  // Tabs are driven by DATA, like the mech page: Skills / Skin only
  // appear when the weapon actually has that content.
  const tabs = [
    "Overview",
    ...(weapon.skillNodes.length > 0 ? ["Skills"] : []),
    ...(weapon.weaponSkins.length + weapon.helpers.length > 0 ? ["Skin"] : []),
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/weapons" className="text-sm text-ink-dim hover:text-accent">
        ← All weapons
      </Link>

      <header className="mt-3 mb-5 flex gap-5">
        {weapon.imageUrl && (
          <img
            src={imageSrc(weapon.imageUrl)}
            alt={weapon.name}
            className="mb-4 h-48 w-48 rounded-xl border border-edge object-cover"
          />
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">{weapon.name}</h1>
            <RankBadge rank={weapon.tier} />
            {weapon.type && <TypeBadge type={weapon.type} />}
          </div>
          {weapon.description && <p className="mt-1 text-ink-dim">{weapon.description}</p>}
        </div>
      </header>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="py-4">
        {activeTab === "Overview" && <WeaponOverviewTab weapon={weapon} />}
        {activeTab === "Skills" && <SkillsTab nodes={weapon.skillNodes} />}
        {activeTab === "Skin" && (
          <div className="space-y-6">
            <WeaponSkins skins={weapon.weaponSkins} />
            <WeaponHelpers helpers={weapon.helpers} />
          </div>
        )}
      </div>
    </main>
  );
}
