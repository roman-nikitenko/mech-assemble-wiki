import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAwakening, useAwakeningCostTiers, useMech, useSaveAwakening } from "../../api/client";
import type { AwakeningLevel, AwakeningNode } from "../../api/types";
import { AwakeningLevelPanel } from "./AwakeningLevelPanel";
import { ImportAwakeningDialog } from "./ImportAwakeningDialog";
import { importCodexMech, type ImportedLevel, type ImportedNode } from "./awakeningImport";

const LEVELS = [1, 2, 3, 4, 5, 6];

/** A blank level, so all six panels exist even before anything is entered. */
function emptyLevel(level: number): ImportedLevel {
  return {
    level, isLive: level <= 3, coreAttr: [], coreSkill: null, coreInfo: null,
    coreCd: [], corePower: null, coreLuckyId: null, coreReward: null, coreSkin: null,
    nodes: [],
  };
}

// Strips the server-assigned `id` from a node/level (the PUT body has no ids —
// the server recreates rows on save). Explicit field lists rather than a
// `{ id: _id, ...rest }` destructure: this project lints with oxlint, and
// listing fields keeps every field named ImportedNode/ImportedLevel actually
// expects rather than trusting `...rest` to shed exactly one key.
function nodeFromServer(n: AwakeningNode): ImportedNode {
  return {
    position: n.position,
    icon: n.icon,
    mechStat: n.mechStat,
    enhText: n.enhText,
    enhModes: n.enhModes,
    condEntry: n.condEntry,
    condTargetId: n.condTargetId,
    condThreshold: n.condThreshold,
    condText: n.condText,
    condRaw: n.condRaw,
  };
}

function levelFromServer(row: AwakeningLevel): ImportedLevel {
  return {
    level: row.level,
    isLive: row.isLive,
    coreAttr: row.coreAttr,
    coreSkill: row.coreSkill,
    coreInfo: row.coreInfo,
    coreCd: row.coreCd,
    corePower: row.corePower,
    coreLuckyId: row.coreLuckyId,
    coreReward: row.coreReward,
    coreSkin: row.coreSkin,
    nodes: row.nodes.map(nodeFromServer),
  };
}

function fromServer(rows: AwakeningLevel[]): ImportedLevel[] {
  return LEVELS.map((n) => {
    const row = rows.find((r) => r.level === n);
    return row ? levelFromServer(row) : emptyLevel(n);
  });
}

export function AwakeningPage() {
  const { id = "" } = useParams<{ id: string }>();
  const mech = useMech(id);
  const saved = useAwakening(id);
  const tiers = useAwakeningCostTiers();
  const save = useSaveAwakening(id);

  const [levels, setLevels] = useState<ImportedLevel[]>(() => LEVELS.map(emptyLevel));
  const [importing, setImporting] = useState(false);

  // Seed once the server rows arrive. Keyed on the query data so a refetch after
  // save re-seeds from the truth rather than leaving edits floating.
  useEffect(() => {
    if (saved.data) setLevels(fromServer(saved.data));
  }, [saved.data]);

  function setLevel(next: ImportedLevel) {
    setLevels((prev) => prev.map((l) => (l.level === next.level ? next : l)));
  }

  if (saved.isPending) return <p className="text-ink-dim">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <Link to={`/admin/mechs/${id}/edit`} className="text-sm text-ink-dim hover:text-accent">
        ← {mech.data?.name ?? "Back to mech"}
      </Link>
      <h1 className="mt-2 text-xl font-black tracking-tight">Awakening</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Six levels, each with five outer nodes and one core node. Costs come from the
        global ladder and are not edited here.
      </p>

      <button
        type="button"
        onClick={() => setImporting(true)}
        className="mt-2 min-h-11 rounded-lg border border-edge px-4 text-sm hover:border-accent/60"
      >
        Import JSON
      </button>
      <ImportAwakeningDialog<ImportedLevel[]>
        open={importing}
        onClose={() => setImporting(false)}
        hint="Paste this mech's JSON block. It fills the form below — nothing is saved until you press Save awakening."
        // The dialog is generic; this adapts the mapper's result to its shape.
        parse={(json) => {
          const r = importCodexMech(json);
          return r.ok ? { ok: true, value: r.levels } : r;
        }}
        onImport={(imported) =>
          // Fill every level the paste supplied; leave the others as they are,
          // so a partial paste doesn't blank out work already entered.
          setLevels((prev) =>
            prev.map((l) => imported.find((i) => i.level === l.level) ?? l)
          )
        }
      />

      {levels.map((l) => (
        <AwakeningLevelPanel
          key={l.level}
          value={l}
          tier={tiers.data?.find((t) => t.level === l.level)}
          onChange={setLevel}
        />
      ))}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => save.mutate(levels)}
          disabled={save.isPending}
          className="min-h-11 rounded-lg border border-accent px-4 text-sm disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save awakening"}
        </button>
        {save.isError && <span className="text-sm text-fire">{save.error.message}</span>}
        {save.isSuccess && <span className="text-sm text-accent">Saved.</span>}
      </div>
    </div>
  );
}
