import type { MechType } from "../api/types";

// The single source of truth for element colors in the app.
// bg-*/15 = 15% opacity fill; border-*/40 = 40% opacity outline.
const TYPE_STYLES: Record<MechType, string> = {
  Fire: "bg-fire/15 text-fire border-fire/40",
  Thunder: "bg-thunder/15 text-thunder border-thunder/40",
  Physical: "bg-physical/15 text-physical border-physical/40",
  Ice: "bg-ice/15 text-ice border-ice/40",
  Energy: "bg-energy/15 text-energy border-energy/40",
  Explosive: "bg-explosive/15 text-explosive border-explosive/40",
};

export function TypeBadge({ type }: { type: MechType }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TYPE_STYLES[type]}`}
    >
      {type}
    </span>
  );
}
