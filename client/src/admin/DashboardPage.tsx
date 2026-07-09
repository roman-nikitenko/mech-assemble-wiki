import { MockBadge } from "./MockBadge";

// Placeholder metrics — the features they measure don't exist yet.
// Each card notes which future phase will make it real.
const STATS = [
  { label: "Registered users", value: "1,248", note: "real value arrives with the accounts phase" },
  { label: "Posts created", value: "3,571", note: "real value arrives with the posts feature" },
  { label: "Site visitors (30d)", value: "18,904", note: "real value arrives with analytics" },
];

export function DashboardPage() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <MockBadge hint="These numbers are placeholders — the features they measure don't exist yet." />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-edge bg-surface p-5">
            <p className="text-sm text-ink-dim">{s.label}</p>
            <p className="mt-1 text-3xl font-black text-accent">{s.value}</p>
            <p className="mt-2 text-xs text-ink-dim">{s.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
