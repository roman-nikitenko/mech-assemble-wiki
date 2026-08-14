import { imageSrc, useTypes } from "../api/client";
import type { MechRank } from "../api/types";
import { ButtonGroup } from "../components/ButtonGroup";
import { STierIcon } from "../components/STierIcon";

const TIERS: MechRank[] = ["Standard", "S"];

interface AdminTableFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  /** Selected type id, or "" for "all types". Only used when showType. */
  typeId?: string;
  onTypeId?: (value: string) => void;
  /** Show the Type filter — off for tables without a type (e.g. accessories). */
  showType?: boolean;
  /** Selected rank/tier, or "" for "all". Only used when showTier. */
  tier?: string;
  onTier?: (value: string) => void;
  /** Show the Tier filter — off for tables without a tier (e.g. pilots). */
  showTier?: boolean;
  /** Wording for the rank field: "Tier" (weapons) or "Rank" (mechs). */
  tierLabel?: string;
}

/** Shared filter bar for the admin Mechs/Weapons tables: search-by-name plus
    Type and Tier/Rank button groups. Filtering itself happens in the caller —
    this component only renders the controls and reports changes. */
export function AdminTableFilters({
  search,
  onSearch,
  typeId = "",
  onTypeId,
  showType = true,
  tier = "",
  onTier,
  showTier = true,
  tierLabel = "Tier",
}: AdminTableFiltersProps) {
  const types = useTypes();
  const lower = tierLabel.toLowerCase();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        aria-label="Search by name"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="min-h-11 w-44 rounded-lg border border-edge bg-surface px-3 text-sm"
      />
      {/* No "all" button — an empty selection already means "show all". Both
          groups are toggleable, so clicking the active button clears it. */}
      {showType && (
      <ButtonGroup
        ariaLabel="Filter by type"
        labelPrefix="Type"
        iconOnly
        toggleable
        value={typeId}
        onChange={onTypeId ?? (() => {})}
        options={(types.data ?? []).map((t) => ({
          value: t.id,
          label: t.name,
          icon: t.iconUrl ? (
            <img
              src={imageSrc(t.iconUrl)}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : undefined,
        }))}
      />
      )}
      {showTier && (
      <ButtonGroup
        ariaLabel={`Filter by ${lower}`}
        labelPrefix={tierLabel}
        iconOnly
        toggleable
        value={tier}
        onChange={onTier ?? (() => {})}
        options={TIERS.map((t) => ({
          value: t,
          label: t,
          // S-tier gets the drawn gold badge (shown next to the label).
          icon: t === "S" ? <STierIcon size={18} /> : undefined,
        }))}
      />
      )}
    </div>
  );
}
