import type { GameType, MechRank } from "../api/types";

const RANKS: MechRank[] = ["Standard", "S"];

interface FilterBarProps {
  types: GameType[]; // the catalog, loaded by the page
  typeId: string; // "" = no filter
  rank: MechRank | "";
  search: string;
  onTypeIdChange: (t: string) => void;
  onRankChange: (r: MechRank | "") => void;
  onSearchChange: (s: string) => void;
}

/** Controlled component: state lives in BrowsePage, this just renders it.
    "" means "no filter" for the selects. Type options come from the API now —
    the old hard-coded list died with the MechType enum. */
export function FilterBar({
  types,
  typeId,
  rank,
  search,
  onTypeIdChange,
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
          value={typeId}
          onChange={(e) => onTypeIdChange(e.target.value)}
          className={fieldCls}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
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
