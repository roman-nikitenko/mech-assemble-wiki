import { Dropdown } from "../components/Dropdown";
import { QualityIcon } from "../components/QualityIcon";
import { QUALITY_TIERS, type QualityTier } from "../api/types";

/** Quality tier picker for a build subject/weapon — the reusable Dropdown with
    a colored hexagon icon per tier. Shared by the build editor and the
    skill calculator. */
export function QualitySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: QualityTier;
  onChange: (tier: QualityTier) => void;
}) {
  return (
    <div className="mt-5 max-w-[220px]">
      <span className="mb-1 block text-sm font-semibold text-ink-dim">{label}</span>
      <Dropdown
        ariaLabel={label}
        value={value}
        onChange={(v) => onChange(v as QualityTier)}
        options={QUALITY_TIERS.map((t) => ({
          value: t,
          label: t,
          icon: <QualityIcon tier={t} size={16} />,
        }))}
      />
    </div>
  );
}
