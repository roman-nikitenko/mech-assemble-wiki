import { useEffect, useRef, useState } from "react";
import { imageSrc } from "../api/client";
import type { GameType, ModuleQuality, ModuleSelection, ModuleSummary } from "../api/types";
import { qualityCardStyle } from "../lib/moduleCardStyle";
import { BuildModuleCard } from "../pages/profile/BuildModuleCard";

/** The build's attack-module picks, shown as a row of tier-bordered icon
    squares on a build preview card. Hovering (desktop) or tapping (mobile) a
    square pops up the full read-only module card. Renders nothing when the
    build configured no modules. */
export function ModulePicksPreview({
  modules,
  selections,
  types,
  qualities,
}: {
  modules: ModuleSummary[];
  selections: Record<string, ModuleSelection>;
  types: GameType[];
  qualities: ModuleQuality[];
}) {
  // Only modules the build actually configured (an entry in moduleSelections),
  // kept in catalog order so the squares stay stable across builds.
  const picked = modules.filter((m) => selections[m.id]);
  const [openId, setOpenId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on tap/click outside — the mobile dismiss path (desktop also closes
  // on mouse-leave below).
  useEffect(() => {
    if (!openId) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenId(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openId]);

  if (picked.length === 0) return null;

  return (
    <div ref={ref} className="flex flex-wrap justify-end gap-2">
      {picked.map((m) => {
        const sel = selections[m.id];
        const style = qualityCardStyle(sel.quality);
        const open = openId === m.id;
        return (
          <div
            key={m.id}
            className="relative"
            // Desktop: hover opens/closes. Touch devices don't fire these, so
            // mobile relies on click (open) + outside-tap (close) instead.
            onMouseEnter={() => setOpenId(m.id)}
            onMouseLeave={() => setOpenId((cur) => (cur === m.id ? null : cur))}
          >
            <button
              type="button"
              aria-label={`${m.name} — ${sel.quality}`}
              aria-expanded={open}
              onClick={() => setOpenId(m.id)}
              className="flex h-12 w-12 shrink-0 items-center justify-center bg-cover bg-center"
              style={style.iconBorder ? { backgroundImage: `url(${style.iconBorder})` } : undefined}
            >
              {m.iconUrl && <img src={imageSrc(m.iconUrl)} alt="" className="p-1 object-contain" />}
            </button>
            {open && (
              // pt-2 bridges the visual gap so moving the mouse from square to
              // card (both descendants of this div) doesn't trigger mouse-leave.
              <div className="absolute right-0 top-full z-50 pt-2">
                <BuildModuleCard module={m} types={types} qualities={qualities} selection={sel} readOnly />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
