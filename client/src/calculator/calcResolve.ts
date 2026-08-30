import type { SkillNodeRow } from "../api/types";
import { skillKey } from "./calcLink";

export interface ResolvedPicks {
  /** Full skill ids, in the link's original order. */
  ids: string[];
  /** How many keys matched nothing — the admin deleted that skill since the
      link was made. Counted, not silently dropped, so the page can say so. */
  missing: number;
}

/** Link keys → real skill ids, against ONE owner's pool.

    On the (measured: never) chance that two nodes in the same pool share a
    6-char prefix, the first by pool order wins — deterministic, so the same
    link always resolves the same way. */
export function keysToIds(pool: SkillNodeRow[], keys: string[]): ResolvedPicks {
  const byKey = new Map<string, string>();
  for (const n of pool) {
    const key = skillKey(n.id);
    if (!byKey.has(key)) byKey.set(key, n.id);
  }
  const ids: string[] = [];
  let missing = 0;
  for (const key of keys) {
    const id = byKey.get(key);
    if (id === undefined) missing += 1;
    else ids.push(id);
  }
  return { ids, missing };
}

export function idsToKeys(ids: string[]): string[] {
  return ids.map(skillKey);
}
