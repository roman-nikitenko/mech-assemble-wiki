// Public catalog lists show the most recently added item first.
//
// Ties fall back to name (A-Z): rows that existed before the created_at
// column was added all share the migration's timestamp, so without a
// tie-break their order would be arbitrary.
export function sortNewestFirst<T extends { createdAt: string; name: string }>(
  items: readonly T[],
): T[] {
  // Copy first — Array.sort mutates, and `items` is TanStack Query's cached array.
  return [...items].sort(
    (a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.name.localeCompare(b.name),
  );
}
