import { useState } from "react";
import { useHiddenAchievements } from "../../api/client";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";
import { HiddenAchievementCard } from "./HiddenAchievementCard";

/** The Hidden Achievements sub-tab: one card per achievement, hardest quality
    first, with a search box over the name and description. */
export function AchievementsSection() {
  const { data, isPending, isError, refetch } = useHiddenAchievements();
  const [search, setSearch] = useState("");

  if (isPending) return <LoadingSkeleton variant="cards" />;
  if (isError) return <ErrorPanel onRetry={() => refetch()} />;

  const query = search.trim().toLowerCase();
  const visible = data
    .filter((a) => !query || a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query))
    // Hardest first. Array.prototype.sort is stable, so achievements sharing a
    // quality keep the server's order (sortOrder, then name).
    .sort((a, b) => b.tier - a.tier);

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search achievements..."
        aria-label="Search achievements"
        className="min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm sm:w-64"
      />

      {data.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No hidden achievements recorded yet.</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">No achievements match.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {visible.map((a) => (
            <HiddenAchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
    </div>
  );
}
