// An item counts as "new" for one week after it was added (created_at).
export const NEW_ITEM_DAYS = 7;

// `now` is a parameter so tests don't depend on the real clock.
export function isNewItem(createdAt: string, now: number = Date.now()): boolean {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false; // missing/garbled date: never badge
  return now - created < NEW_ITEM_DAYS * 24 * 60 * 60 * 1000;
}
