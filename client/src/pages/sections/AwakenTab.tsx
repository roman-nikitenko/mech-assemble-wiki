import { useAwakeningCostTiers } from "../../api/client";
import type { AwakeningCostTier, AwakeningLevel, AwakeningNode } from "../../api/types";
import { AwakeningIcon } from "../../components/AwakeningIcon";

/* The game's own tier colours, read off the node VFX names in its config
   (_lv green, _lan blue, _zi purple, _huang gold, _hong red, _qing cyan for
   levels 1-6). Kept as a plain map because Tailwind can't build a class name
   from runtime data — these reach the DOM as inline colours instead. */
const TIER_COLOR: Record<number, string> = {
  1: "#4FBF86",
  2: "#6BA6DC",
  3: "#B08BE0",
  4: "#E0B142",
  5: "#E5786B",
  6: "#4FC3C9",
};

const tierColor = (level: number) => TIER_COLOR[level] ?? "#93a0b8";

/** Costs come from the global 6-row ladder, not from the node — they're
    identical for every mech. Undefined until an admin fills the ladder in,
    which is why every caller treats it as optional rather than blank. */
function costFor(tiers: AwakeningCostTier[] | undefined, level: number) {
  return tiers?.find((t) => t.level === level);
}

/* An unlock condition names a thing you have to level up — an accessory, a
   weapon, a driver, a skin. The thing's NAME is what a player scans for, so it
   is emphasised and the boilerplate around it is not.

   Five of the eight condition types follow "<kind> <name> <verb> <threshold>";
   the other three are counts with no name in them ("2 Mech(s) reached Awakening
   Phase 4.") and fall through unchanged. Longest kinds first, so "Weapon Skin"
   is not mistaken for "Weapon". */
const NAMED_CONDITION =
  /^(Weapon Skin|Mech Skin|Accessory|Weapon|Driver)\s+(.+?)\s+(has reached|reached|arrived at)\s+(.+)$/;

function ConditionText({ text }: { text: string }) {
  const m = NAMED_CONDITION.exec(text);
  if (!m) return <>{text}</>;
  const [, kind, name, verb, rest] = m;
  return (
    <>
      {kind} <span className="font-bold text-ink">{name}</span> {verb} {rest}
    </>
  );
}

/** One outer node: what it grants, what unlocks it, what it costs. */
function NodeRow({
  node,
  level,
  tier,
}: {
  node: AwakeningNode;
  level: number;
  tier: AwakeningCostTier | undefined;
}) {
  return (
    <li className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-edge/60 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
      {/* identity: icon, position label, and the stat itself */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          <AwakeningIcon icon={node.icon} size={34} />
        </span>
        <div className="min-w-0">
          <span className="block font-mono text-xs tracking-widest text-ink-dim">
            {level}-{node.position}
          </span>
          <span className="block font-semibold">{node.mechStat ?? node.enhText ?? "—"}</span>
          {/* enhModes lists the gameplay modes a bonus is excluded from. The
              ids have no shipped name table, so we show the numbers plainly
              rather than inventing labels for them. */}
          {node.enhModes.length > 0 && (
            <span className="block text-xs text-ink-dim">
              Not applied in modes {node.enhModes.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* what unlocks it */}
      <div className="min-w-0">
        {node.condText && (
          <>
            <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-dim">
              Requires
            </span>
            <span className="block text-sm">
              <ConditionText text={node.condText} />
            </span>
          </>
        )}
      </div>

      {/* what it costs — absent entirely until the ladder is filled in */}
      {tier && (
        <div className="font-mono text-xs text-ink-dim sm:text-right">
          <span className="block">
            <span className="text-ink">{tier.outerPoints.toLocaleString()}</span> pts
          </span>
          <span className="block">
            <span className="text-ink">{tier.outerShards}</span> shards
          </span>
        </div>
      )}
    </li>
  );
}

/** The level's core node — one per level, and the thing the five outer nodes
    are spent to reach. Marked by its numeral rather than an icon. */
function CoreRow({
  level,
  tier,
}: {
  level: AwakeningLevel;
  tier: AwakeningCostTier | undefined;
}) {
  const color = tierColor(level.level);
  const hasBody =
    level.coreAttr.length > 0 || level.coreSkill || level.coreReward || level.coreSkin;
  if (!hasBody && !tier) return null;

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-edge bg-surface-2/40 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm"
          style={{ borderColor: color, color }}
        >
          {level.level}
        </span>
        <div className="min-w-0">
          <h3 className="font-nasalization text-sm uppercase tracking-wide">
            Awakening Lv.{level.level} — Core node
          </h3>
          {level.coreAttr.length > 0 && (
            <p className="mt-1 font-mono text-sm" style={{ color }}>
              {level.coreAttr.join("  /  ")}
            </p>
          )}
          {level.coreSkill && (
            <p className="mt-1 font-semibold">
              {level.coreSkill}
              {level.coreInfo && (
                <span className="font-normal text-ink-dim"> — {level.coreInfo}</span>
              )}
            </p>
          )}
          {level.coreReward && (
            <p className="mt-1 text-sm text-ink-dim">Reward: {level.coreReward}</p>
          )}
          {level.coreSkin && (
            <p className="mt-1 text-sm text-ink-dim">Unlocks skin: {level.coreSkin}</p>
          )}
        </div>
      </div>

      {tier && (
        <div className="font-mono text-xs text-ink-dim sm:text-right">
          <span className="block">
            <span className="text-ink">{tier.coreMajor}</span> major
          </span>
          <span className="block">
            <span className="text-ink">{tier.coreShards}</span> shards
          </span>
        </div>
      )}
    </div>
  );
}

/** One awakening level: header, its five outer nodes, its core node, and the
    account-wide grant every outer node on this level pays out. */
function LevelBlock({
  level,
  tier,
}: {
  level: AwakeningLevel;
  tier: AwakeningCostTier | undefined;
}) {
  const color = tierColor(level.level);

  return (
    <section
      className="overflow-hidden rounded-xl border border-edge bg-surface/60"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2 bg-surface-2/50 px-4 py-3">
        <h2
          className="font-nasalization text-base uppercase tracking-wide"
          style={{ color }}
        >
          Awakening Lv.{level.level}
        </h2>

        {tier && (
          <span className="font-mono text-xs text-ink-dim">
            outer <span className="text-ink">{tier.outerPoints.toLocaleString()}</span> pts +{" "}
            <span className="text-ink">{tier.outerShards}</span> shards each · core{" "}
            <span className="text-ink">{tier.coreMajor}</span> major +{" "}
            <span className="text-ink">{tier.coreShards}</span> shards
            {level.corePower !== null && (
              <>
                {" · "}
                <span className="text-ink">+{level.corePower.toLocaleString()}</span> power
              </>
            )}
          </span>
        )}
      </header>

      {level.nodes.length > 0 && (
        <ul>
          {level.nodes.map((n) => (
            <NodeRow key={n.id} node={n} level={level.level} tier={tier} />
          ))}
        </ul>
      )}

      <CoreRow level={level} tier={tier} />

      {tier && tier.acctStats.length > 0 && (
        <p className="border-t border-edge px-4 py-3 text-xs text-ink-dim">
          Each outer node also grants account-wide{" "}
          <span className="font-mono text-ink">{tier.acctStats.join("  /  ")}</span>.
        </p>
      )}
    </section>
  );
}

export function AwakenTab({ levels }: { levels: AwakeningLevel[] }) {
  // The cost ladder is global and identical for every mech, so it's a separate
  // cached read rather than something the mech payload carries.
  const tiers = useAwakeningCostTiers();

  if (levels.length === 0) {
    return (
      <p className="text-sm text-ink-dim">
        No awakening data recorded for this mech yet.
      </p>
    );
  }

  // Levels 4-6 are authored in the game files but not switched on, so the page
  // shows only what a player can actually reach today and names the rest.
  const live = levels.filter((l) => l.isLive);
  const upcoming = levels.filter((l) => !l.isLive).map((l) => l.level);

  return (
    <div className="space-y-4">
      {live.map((lvl) => (
        <LevelBlock key={lvl.id} level={lvl} tier={costFor(tiers.data, lvl.level)} />
      ))}

      {upcoming.length > 0 && (
        <p className="rounded-xl border border-dashed border-edge px-4 py-3 text-center font-nasalization text-sm uppercase tracking-wide text-ink-dim">
          Awakening Lv.{upcoming[0]}
          {upcoming.length > 1 && `–${upcoming[upcoming.length - 1]}`} — coming soon
        </p>
      )}

      {live.length === 0 && upcoming.length === 0 && (
        <p className="text-sm text-ink-dim">
          No awakening data recorded for this mech yet.
        </p>
      )}
    </div>
  );
}
