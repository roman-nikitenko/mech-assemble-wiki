import { useSearchParams } from "react-router-dom";
import { Seo } from "../../components/Seo";
import { Tabs } from "../../components/Tabs";
import { ArsenalSection } from "./ArsenalSection";
import { AchievementsSection } from "./AchievementsSection";

const ARSENAL = "Arsenal";
const ACHIEVEMENTS = "Hidden Achievements";

// Arsenal is the default and carries no ?tab= at all, so /final-raid is the
// clean URL; the other sub-tab is linkable as ?tab=achievements.
const TAB_PARAM: Record<string, string> = { [ACHIEVEMENTS]: "achievements" };

/** Public Final Raid page: the mode's gear (Arsenal) and its hidden
    achievements, one sub-tab each. Browsing only — no detail pages, like the
    Drones and Aircraft pages. */
export function FinalRaidPage() {
  const [params, setParams] = useSearchParams();
  // Anything unrecognised falls back to Arsenal rather than a blank page.
  const active = params.get("tab") === "achievements" ? ACHIEVEMENTS : ARSENAL;

  const seo =
    active === ACHIEVEMENTS
      ? {
          title: "Final Raid hidden achievements — Mech Assemble Wiki",
          description:
            "Every hidden achievement in the Mech Assemble: Zombie Swarm Final Raid — what to do and what it rewards.",
          path: "/final-raid?tab=achievements",
        }
      : {
          title: "Final Raid arsenal — Mech Assemble Wiki",
          description:
            "Final Raid gear in Mech Assemble: Zombie Swarm — the default arsenal and every set with its 2-piece and 4-piece bonuses.",
          path: "/final-raid",
        };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo {...seo} />
      <h1 className="text-2xl font-black tracking-tight">Final Raid</h1>
      <p className="mt-1 mb-4 text-sm text-ink-dim">
        Progression resets at the door: power is rebuilt from gear found inside the raid.
      </p>

      <Tabs
        tabs={[ARSENAL, ACHIEVEMENTS]}
        active={active}
        onChange={(tab) => setParams(TAB_PARAM[tab] ? { tab: TAB_PARAM[tab] } : {})}
      />

      <div className="mt-4">
        {active === ACHIEVEMENTS ? <AchievementsSection /> : <ArsenalSection />}
      </div>
    </main>
  );
}
