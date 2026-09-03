import type { AwakeningCostTier } from "../../api/types";

type Result =
  | { ok: true; tiers: AwakeningCostTier[] }
  | { ok: false; message: string };

/** A cost figure: a non-negative safe integer, or null if it is anything else.
    Costs cannot be negative, and beyond Number.MAX_SAFE_INTEGER the value has
    already lost precision — the cost-ladder page clamps typed input the same
    way, so a paste and a keystroke agree. */
function int(v: unknown): number | null {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
}

function strs(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}

/** Reads the six-rung cost ladder out of a codex mech block.

    The costs live on every node in the codex — `pts`/`sh` on each outer node,
    `major`/`sh` on the core, `acct` on each outer node — but they are IDENTICAL
    for all 19 mechs and vary only by level, which is why this wiki stores them
    once globally instead of on all 684 node rows. So any single mech's block is
    a complete source for the whole ladder: we read level N's figures off its
    first outer node and its core.

    Accepts a single mech object or the whole codex blob (`{ mechs: [...] }`),
    in which case the first mech is used — for the ladder specifically, WHICH
    mech does not matter, because they all agree. */
export function importCostTiers(json: unknown): Result {
  if (json === null || typeof json !== "object") {
    return { ok: false, message: "That is not a JSON object." };
  }
  const obj = json as Record<string, unknown>;
  const mech = Array.isArray(obj.mechs) ? obj.mechs[0] : obj;
  if (mech === undefined || mech === null || typeof mech !== "object") {
    return { ok: false, message: "That codex has no mechs in it." };
  }

  const lv = (mech as Record<string, unknown>).lv;
  if (!Array.isArray(lv)) {
    return { ok: false, message: "That JSON has no `lv` array — is it a codex mech block?" };
  }
  if (lv.length !== 6) {
    return {
      ok: false,
      message: `The ladder needs all six levels; this block has ${lv.length}.`,
    };
  }

  const tiers: AwakeningCostTier[] = [];
  for (let i = 0; i < 6; i++) {
    const level = lv[i] as Record<string, unknown>;
    const nodes = Array.isArray(level?.nodes) ? level.nodes : [];
    const first = nodes[0] as Record<string, unknown> | undefined;
    const big = (level?.big ?? {}) as Record<string, unknown>;

    // Every outer node at a level carries the same cost, so the first one
    // speaks for all five.
    const outerPoints = int(first?.pts);
    const outerShards = int(first?.sh);
    const coreMajor = int(big.major);
    const coreShards = int(big.sh);

    if (outerPoints === null || outerShards === null || coreMajor === null || coreShards === null) {
      return {
        ok: false,
        message: `Level ${i + 1} is missing its cost figures — expected pts/sh on a node and major/sh on the core.`,
      };
    }

    tiers.push({
      level: i + 1,
      outerPoints,
      outerShards,
      coreMajor,
      coreShards,
      acctStats: strs(first?.acct),
    });
  }

  return { ok: true, tiers };
}
