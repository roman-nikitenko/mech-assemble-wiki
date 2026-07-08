import type { MechRank, MechType } from "../api/types";

const TYPES: MechType[] = ["Fire", "Thunder", "Physical", "Ice", "Energy", "Explosive"];
const RANKS: MechRank[] = ["Standard", "S"];

interface FilterBarProps {
  type: MechType | "";
  rank: MechRank | "";
  search: string;
  onTypeChange: (t: MechType | "") => void;
  onRankChange: (r: MechRank | "") => void;
  onSearchChange: (s: string) => void;
}

/** Controlled component: state lives in BrowsePage, this just renders it.
    "" means "no filter" for the selects. */
export function FilterBar({
  type,
  rank,
  search,
  onTypeChange,
  onRankChange,
  onSearchChange,
}: FilterBarProps) {
  const fieldCls = "min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm";
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search mechs..."
        className={`${fieldCls} flex-1`}
      />
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as MechType | "")}
          className={fieldCls}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={rank}
          onChange={(e) => onRankChange(e.target.value as MechRank | "")}
          className={fieldCls}
          aria-label="Filter by rank"
        >
          <option value="">All ranks</option>
          {RANKS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
