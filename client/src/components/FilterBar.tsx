import type { GameType, MechRank } from "../api/types";
import { imageSrc, srcSet } from "../api/client";
import { STierIcon } from "./STierIcon";

const RANKS: MechRank[] = ["Standard", "S"];

interface FilterBarProps {
  types: GameType[];
  selectedTypeIds: string[];
  selectedRanks: MechRank[];
  search: string;
  onToggleType: (id: string) => void;
  onToggleRank: (r: MechRank) => void;
  onSearchChange: (s: string) => void;
  onClear: () => void;
  rankGroupLabel?: string;
  searchPlaceholder?: string;
  customClass?: string;
  showAttributes?: boolean;
  attributes?: string[];
  selectedAttributes?: string[];
  onToggleAttribute?: (name: string) => void;
}

function chipCls(active: boolean): string {
  const base =
    "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1 text-sm font-semibold transition-colors";
  return active
    ? `${base} border-accent bg-accent/15 text-accent`
    : `${base} border-edge bg-surface text-ink-dim hover:text-ink`;
}

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
  customClass = "",
  showAttributes = false,
  attributes = [],
  selectedAttributes = [],
  onToggleAttribute,
}: FilterBarProps) {
  const hasFilters =
    selectedTypeIds.length > 0 || selectedRanks.length > 0 || selectedAttributes.length > 0;

  return (
    <div className={`flex flex-col gap-3 ${customClass}`}>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="min-h-11 rounded-lg border border-edge bg-surface px-3 text-sm"
      />
      <div className="flex flex-col justify-start md:flex-row md:[&>div+div]:border-edge md:[&>div+div]:ml-4 md:[&>div+div]:border-l md:[&>div+div]:pl-4   ">
        {types.length > 0 && (
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
                      className="h-6 w-6"
                    />
                  )}
                  <span className="hidden md:block">
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div
          className="flex flex-wrap gap-2 "
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
                {r === "S" ? <STierIcon size={28} className="inline align-middle" /> : r}

              </button>
            );
          })}


        </div>

        {showAttributes && attributes.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by attribute">
            {attributes.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={selectedAttributes.includes(name)}
                onClick={() => onToggleAttribute?.(name)}
                className={chipCls(selectedAttributes.includes(name))}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer border border-edge rounded-lg w-fit px-2 py-1 md:ml-2 text-sm text-ink-dim underline hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
