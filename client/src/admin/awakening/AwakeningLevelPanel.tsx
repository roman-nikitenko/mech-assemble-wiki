import { useEffect, useState } from "react";
import type { AwakeningCostTier } from "../../api/types";
import type { ImportedLevel, ImportedNode } from "./awakeningImport";
import { AwakeningIcon } from "../../components/AwakeningIcon";

const NODE_COUNT = 5;

const BLANK_NODE = (position: number): ImportedNode => ({
  position, icon: null, mechStat: null, enhText: null, enhModes: [],
  condEntry: null, condTargetId: null, condThreshold: null, condText: null, condRaw: null,
});

/** A node counts as "filled" if the admin put anything meaningful into it —
    not just icon/condText, so a node carrying only e.g. mechStat still shows
    up in the (x/5) badge. That badge is the only feedback the admin gets that
    typing into a node actually stuck. */
function isNodeFilled(n: ImportedNode): boolean {
  return (
    n.icon !== null || n.mechStat !== null || n.enhText !== null || n.enhModes.length > 0 ||
    n.condEntry !== null || n.condTargetId !== null || n.condThreshold !== null ||
    n.condText !== null || n.condRaw !== null
  );
}

/** One collapsible awakening level: its live flag, the core node's fields, and
    five outer node rows. Costs are NOT editable here — they come from the
    global ladder and are shown read-only so the admin can sanity-check them. */
export function AwakeningLevelPanel({
  value,
  tier,
  onChange,
}: {
  value: ImportedLevel;
  tier: AwakeningCostTier | undefined;
  onChange: (next: ImportedLevel) => void;
}) {
  const [open, setOpen] = useState(false);
  const filled = value.nodes.filter(isNodeFilled).length;

  // The editor always shows 5 rows even when the server returned fewer, so an
  // empty level can be filled in without an "add node" step.
  const rows: ImportedNode[] = Array.from({ length: NODE_COUNT }, (_, i) => value.nodes[i] ?? BLANK_NODE(i + 1));

  // Writes must go through the PADDED `rows`, not the raw `value.nodes`: when a
  // level has fewer than 5 saved nodes, `value.nodes.map` never visits an index
  // past its own length, so the edit was silently dropped and the controlled
  // input snapped back to empty. Padding first means every row 0-4 is always
  // addressable, including on a brand-new level whose `nodes` starts as [].
  function setNode(i: number, patch: Partial<ImportedNode>) {
    const nodes = rows.map((n, j) => (j === i ? { ...n, ...patch } : n));
    onChange({ ...value, nodes });
  }

  const [coreAttrText, setCoreAttrText] = useState(() => value.coreAttr.join("\n"));
  // Re-sync the raw textarea text only when the underlying array actually
  // changes identity (fresh data load, an import) — not on every render, so a
  // keystroke here is never clobbered by an unrelated edit elsewhere on the
  // same level (which spreads `value` but keeps the same `coreAttr` array).
  useEffect(() => {
    setCoreAttrText(value.coreAttr.join("\n"));
  }, [value.coreAttr]);

  function commitCoreAttr(text: string) {
    onChange({ ...value, coreAttr: text.split("\n").map((s) => s.trim()).filter((s) => s !== "") });
  }

  return (
    <section className="mt-3 rounded-xl border border-edge bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-sm font-semibold hover:text-accent"
      >
        <span>
          Awakening Lv.{value.level}{" "}
          <span className="text-ink-dim">({filled}/{NODE_COUNT} nodes)</span>
          {!value.isLive && (
            <span className="ml-2 rounded bg-surface-2 px-2 py-0.5 text-xs text-ink-dim">
              not enabled
            </span>
          )}
        </span>
        <span className="text-ink-dim">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-edge p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.isLive}
              onChange={(e) => onChange({ ...value, isLive: e.target.checked })}
            />
            Live in the current game build
          </label>

          {tier && (
            <p className="text-xs text-ink-dim">
              Costs (from the global ladder): outer {tier.outerPoints} pts + {tier.outerShards} shards ·
              core {tier.coreMajor} major + {tier.coreShards} shards
              {tier.acctStats.length > 0 && <> · account grant {tier.acctStats.join(", ")}</>}
            </p>
          )}

          <fieldset className="rounded-lg border border-edge p-3">
            <legend className="px-1 text-sm font-semibold">Core node</legend>
            <label className="block text-xs text-ink-dim">Attributes (one per line)</label>
            <textarea
              aria-label={`Level ${value.level} core attributes`}
              value={coreAttrText}
              onChange={(e) => setCoreAttrText(e.target.value)}
              onBlur={(e) => commitCoreAttr(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
            />
            <label className="mt-2 block text-xs text-ink-dim">Skill</label>
            <input
              aria-label={`Level ${value.level} core skill`}
              value={value.coreSkill ?? ""}
              onChange={(e) => onChange({ ...value, coreSkill: e.target.value || null })}
              className="mt-1 min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
            />
            <label className="mt-2 block text-xs text-ink-dim">Skill description</label>
            <input
              aria-label={`Level ${value.level} core skill description`}
              value={value.coreInfo ?? ""}
              onChange={(e) => onChange({ ...value, coreInfo: e.target.value || null })}
              className="mt-1 min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-ink-dim">Reward (Lv.3 only)</label>
                <input
                  aria-label={`Level ${value.level} reward`}
                  value={value.coreReward ?? ""}
                  onChange={(e) => onChange({ ...value, coreReward: e.target.value || null })}
                  className="mt-1 min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-dim">Skin (Lv.6 only)</label>
                <input
                  aria-label={`Level ${value.level} skin`}
                  value={value.coreSkin ?? ""}
                  onChange={(e) => onChange({ ...value, coreSkin: e.target.value || null })}
                  className="mt-1 min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
                />
              </div>
            </div>
          </fieldset>

          {rows.map((n, i) => (
            <fieldset key={n.position} className="rounded-lg border border-edge p-3">
              <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
                <AwakeningIcon icon={n.icon} size={20} /> Node {n.position}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-ink-dim">Icon key</label>
                  <input
                    aria-label={`Level ${value.level} node ${n.position} icon`}
                    value={n.icon ?? ""}
                    onChange={(e) => setNode(i, { icon: e.target.value || null })}
                    placeholder="UI_Attr_hp"
                    className="mt-1 min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-dim">Mech stat</label>
                  <input
                    aria-label={`Level ${value.level} node ${n.position} mech stat`}
                    value={n.mechStat ?? ""}
                    onChange={(e) => setNode(i, { mechStat: e.target.value || null })}
                    placeholder="HP +15%"
                    className="mt-1 min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-ink-dim">Unlock condition (shown on the wiki)</label>
                  <input
                    aria-label={`Level ${value.level} node ${n.position} condition`}
                    value={n.condText ?? ""}
                    onChange={(e) => setNode(i, { condText: e.target.value || null })}
                    className="mt-1 min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-ink-dim">Enhancement</label>
                  <input
                    aria-label={`Level ${value.level} node ${n.position} enhancement`}
                    value={n.enhText ?? ""}
                    onChange={(e) => setNode(i, { enhText: e.target.value || null })}
                    className="mt-1 min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm"
                  />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </section>
  );
}
