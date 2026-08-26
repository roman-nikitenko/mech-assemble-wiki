import { useSearchParams } from "react-router-dom";
import { TypesTab } from "./TypesTab";
import { DroneTypesTab } from "./DroneTypesTab";

const TABS = [
  { key: "mechweapon", label: "Mech / Weapon" },
  { key: "drone", label: "Drone" },
] as const;

/** The Types admin page: a mech/weapon type catalog and a drone type catalog,
    each on its own tab. The active tab lives in the URL (?tab=drone) so it's
    linkable and survives returning from a form. */
export function AdminTypesPage() {
  const [params, setParams] = useSearchParams();
  const active = params.get("tab") === "drone" ? "drone" : "mechweapon";

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">Types</h1>

      <div className="mt-4 flex gap-2 border-b border-edge" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setParams(t.key === "mechweapon" ? {} : { tab: t.key })}
            className={`-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm font-semibold ${
              active === t.key
                ? "border-accent text-accent"
                : "border-transparent text-ink-dim hover:text-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">{active === "drone" ? <DroneTypesTab /> : <TypesTab />}</div>
    </div>
  );
}
