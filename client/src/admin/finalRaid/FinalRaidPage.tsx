import { useSearchParams } from "react-router-dom";
import { ArsenalSetsTab } from "./ArsenalSetsTab";
import { ArsenalTab } from "./ArsenalTab";
import { AchievementsTab } from "./AchievementsTab";

// The key is what goes in the URL (?tab=sets). "arsenal" is the default, so it
// gets no param at all — /admin/final-raid lands on it.
const TABS = [
  { key: "arsenal", label: "Arsenal" },
  { key: "sets", label: "Set arsenal" },
  { key: "achievements", label: "Hidden achievements" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Reads ?tab= and falls back to the default for anything unknown, so a
    mistyped or stale link still shows a real tab instead of a blank page. */
function tabFromParam(value: string | null): TabKey {
  return TABS.find((t) => t.key === value)?.key ?? "arsenal";
}

/** The Final Raid admin page: arsenal gear, the sets that gear belongs to, and
    hidden achievements, one per tab. The active tab lives in the URL (like the
    Types page) so it's linkable and survives returning from a form. */
export function FinalRaidPage() {
  const [params, setParams] = useSearchParams();
  const active = tabFromParam(params.get("tab"));

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">Final Raid</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto border-b border-edge" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setParams(t.key === "arsenal" ? {} : { tab: t.key })}
            className={`-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm font-semibold whitespace-nowrap ${
              active === t.key
                ? "border-accent text-accent"
                : "border-transparent text-ink-dim hover:text-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {active === "arsenal" && <ArsenalTab />}
        {active === "sets" && <ArsenalSetsTab />}
        {active === "achievements" && <AchievementsTab />}
      </div>
    </div>
  );
}
