import type { GameType, MechRank } from "../api/types";
import { imageSrc, srcSet } from "../api/client";
import { STierIcon } from "./STierIcon";

const RANKS: MechRank[] = ["Standard", "S"];

interface FilterBarProps {
  types: GameType[]; // the catalog, loaded by the page
  selectedTypeIds: string[]; // empty = no type filter (show all types)
  selectedRanks: MechRank[]; // empty = no rank/tier filter (show all)
  search: string;
  onToggleType: (id: string) => void;
  onToggleRank: (r: MechRank) => void;
  onSearchChange: (s: string) => void;
  onClear: () => void;
  // The Standard/S group is a mech "rank" but a weapon "tier" — same values,
  // different word. Only affects the group's accessible label and placeholder.
  rankGroupLabel?: string; // default "rank"
  searchPlaceholder?: string; // default "Search mechs..."
}

// Shared look for a toggle chip. `active` gives it the accent fill + ring so a
// pressed filter is obvious at a glance; inactive chips stay muted.
function chipCls(active: boolean): string {
  const base =
    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors";
  return active
    ? `${base} border-accent bg-accent/15 text-accent`
    : `${base} border-edge bg-surface text-ink-dim hover:text-ink`;
}

/** Controlled component: filter state lives in BrowsePage, this just renders it.
    Types and ranks are multi-select toggle buttons (OR within a group). An empty
    selection in a group means "no filter" for that group. */
export function FilterBar({
  types,
  selectedTypeIds,
  selectedRanks,
  search,
  onToggleType,
  onToggleRank,
  onSearchChange,
  onClear,
  rankGroupLabel = "rank",
  searchPlaceholder = "Search mechs...",
}: FilterBarProps) {
  const hasFilters = selectedTypeIds.length > 0 || selectedRanks.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm"
      />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by type">
        {types.map((t) => {
          const active = selectedTypeIds.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => onToggleType(t.id)}
              className={chipCls(active)}
            >
              {t.iconUrl && (
                <img
                  src={imageSrc(t.iconUrl)}
                  srcSet={srcSet(t.iconUrl)}
                  sizes="20px"
                  alt=""
                  className="h-5 w-5"
                />
              )}
              {t.name}
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={`Filter by ${rankGroupLabel}`}
      >
        {RANKS.map((r) => {
          const active = selectedRanks.includes(r);
          return (
            <button
              key={r}
              type="button"
              aria-pressed={active}
              onClick={() => onToggleRank(r)}
              className={chipCls(active)}
            >
              {r === "S" ? <STierIcon size={20} className="inline align-middle" /> : r}
         
            </button>
          );
        })}

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 cursor-pointer px-2 text-sm text-ink-dim underline hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
