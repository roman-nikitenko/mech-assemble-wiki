import { useEffect, useState } from "react";
import { useAwakeningCostTiers, useSaveAwakeningCostTiers } from "../../api/client";
import type { AwakeningCostTier } from "../../api/types";
import { ImportAwakeningDialog } from "./ImportAwakeningDialog";
import { importCostTiers } from "./costTiersImport";
import { CodexFormatHint } from "./CodexFormatHint";

const LEVELS = [1, 2, 3, 4, 5, 6];

const BLANK = (level: number): AwakeningCostTier => ({
  level, outerPoints: 0, outerShards: 0, coreMajor: 0, coreShards: 0, acctStats: [],
});

/** The six-rung global ladder. Costs are identical for every awakening mech and
    vary only by level, so they are entered ONCE here instead of on all 684
    nodes — and they stay data, not hardcoded constants. */
export function AwakeningCostTiersPage() {
  const tiers = useAwakeningCostTiers();
  const save = useSaveAwakeningCostTiers();
  const [rows, setRows] = useState<AwakeningCostTier[]>(() => LEVELS.map(BLANK));
  // Account grant is a comma-joined string[] but re-deriving it from the array
  // on every keystroke deletes the comma and every space the moment they're
  // typed (the field's own placeholder becomes untypeable). Instead we hold
  // the raw text the admin is typing here, keyed by level, and only split it
  // into `acctStats` when the ladder is actually saved.
  const [acctText, setAcctText] = useState<Record<number, string>>(() =>
    Object.fromEntries(LEVELS.map((n) => [n, ""]))
  );
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (tiers.data) {
      const next = LEVELS.map((n) => tiers.data.find((t) => t.level === n) ?? BLANK(n));
      setRows(next);
      setAcctText(Object.fromEntries(next.map((r) => [r.level, r.acctStats.join(", ")])));
    }
  }, [tiers.data]);

  function setRow(level: number, patch: Partial<AwakeningCostTier>) {
    setRows((prev) => prev.map((r) => (r.level === level ? { ...r, ...patch } : r)));
  }

  const numberField = (
    row: AwakeningCostTier,
    key: "outerPoints" | "outerShards" | "coreMajor" | "coreShards",
    label: string
  ) => (
    <td className="p-1">
      <input
        type="number"
        min={0}
        aria-label={`Level ${row.level} ${label}`}
        value={row[key]}
        onChange={(e) => setRow(row.level, { [key]: Math.max(0, Number(e.target.value) || 0) })}
        className="min-h-11 w-24 rounded-lg border border-edge bg-surface px-2 text-sm"
      />
    </td>
  );

  // Parses the buffered account-grant text for every row at the moment of
  // save — the single source of truth for `acctStats` is `acctText`, not
  // `row.acctStats`, which is only ever refreshed from the server.
  function buildPayload(): AwakeningCostTier[] {
    return rows.map((r) => ({
      ...r,
      acctStats: (acctText[r.level] ?? "").split(",").map((s) => s.trim()).filter((s) => s !== ""),
    }));
  }

  if (tiers.isPending) return <p className="text-ink-dim">Loading…</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-black tracking-tight">Awakening cost ladder</h1>
      <p className="mt-1 text-sm text-ink-dim">
        Identical for every awakening mech — entered once here, shown read-only inside
        each mech's Awakening editor.
      </p>

      <button
        type="button"
        onClick={() => setImporting(true)}
        className="mt-3 min-h-11 rounded-lg border border-edge px-4 text-sm hover:border-accent/60"
      >
        Import JSON
      </button>
      <ImportAwakeningDialog<AwakeningCostTier[]>
        open={importing}
        onClose={() => setImporting(false)}
        hint="Paste ANY mech's JSON block — the ladder is identical for all 19, so any one of them carries the whole thing. It fills the table below; nothing is saved until you press Save ladder."
        parse={(json) => {
          const r = importCostTiers(json);
          return r.ok ? { ok: true, value: r.tiers } : r;
        }}
        onImport={(imported) => {
          setRows(imported);
          setAcctText(Object.fromEntries(imported.map((t) => [t.level, t.acctStats.join(", ")])));
        }}
      />

      <CodexFormatHint />

      <div className="mt-4 overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-dim">
              <th className="p-1">Level</th>
              <th className="p-1">Outer pts</th>
              <th className="p-1">Outer shards</th>
              <th className="p-1">Core major</th>
              <th className="p-1">Core shards</th>
              <th className="p-1">Account grant (comma separated)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.level}>
                <td className="p-1 font-semibold">Lv.{row.level}</td>
                {numberField(row, "outerPoints", "outer points")}
                {numberField(row, "outerShards", "outer shards")}
                {numberField(row, "coreMajor", "core major")}
                {numberField(row, "coreShards", "core shards")}
                <td className="p-1">
                  <input
                    aria-label={`Level ${row.level} account grant`}
                    value={acctText[row.level] ?? ""}
                    onChange={(e) => setAcctText((t) => ({ ...t, [row.level]: e.target.value }))}
                    placeholder="HP +3,000, ATK +600, DEF +300"
                    className="min-h-11 w-full min-w-72 rounded-lg border border-edge bg-surface px-2 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => save.mutate(buildPayload())}
          disabled={save.isPending}
          className="min-h-11 rounded-lg border border-accent px-4 text-sm disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save ladder"}
        </button>
        {save.isError && <span className="text-sm text-fire">{save.error.message}</span>}
        {save.isSuccess && <span className="text-sm text-accent">Saved.</span>}
      </div>
    </div>
  );
}
