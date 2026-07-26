import { useDashboardStats } from "../api/client";
import type { VisitorMetric } from "../api/types";

/** Admin Dashboard — live metrics. Registered users and published posts come
    from our DB; site visitors come from Google Analytics (shows "—" until GA
    is configured on the server). */
export function DashboardPage() {
  const stats = useDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>

      {stats.isPending ? (
        <p className="mt-6 text-ink-dim">Loading…</p>
      ) : stats.isError ? (
        <p className="mt-6 text-fire">{(stats.error as Error).message}</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Registered users" metric={stats.data.users} />
          <StatCard label="Posts created" metric={stats.data.posts} />
          <VisitorCard metric={stats.data.visitors} />
        </div>
      )}
    </div>
  );
}

/** One metric card. A null metric (e.g. visitors before GA is wired) renders a
    dash and a hint instead of numbers. */
function StatCard({
  label,
  metric,
  unavailableHint,
}: {
  label: string;
  metric: { total: number; last30: number } | null;
  unavailableHint?: string;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-5">
      <p className="text-sm text-ink-dim">{label}</p>
      {metric ? (
        <>
          <p className="mt-1 text-3xl font-black text-accent">
            {metric.total.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-ink-dim">
            +{metric.last30.toLocaleString()} in last 30 days
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-3xl font-black text-ink-dim">—</p>
          <p className="mt-2 text-xs text-ink-dim">{unavailableHint}</p>
        </>
      )}
    </div>
  );
}

/** Site-visitors card. Shows the overall total big, with "online now" (last 30
    min, from GA Realtime) and "today" underneath. Null (GA not configured on the
    server) renders a dash and a hint, like StatCard. */
function VisitorCard({ metric }: { metric: VisitorMetric | null }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-5">
      <p className="text-sm text-ink-dim">Site visitors</p>
      {metric ? (
        <>
          <p className="mt-1 text-3xl font-black text-accent">
            {metric.total.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-ink-dim">
            {metric.active30min.toLocaleString()} online now ·{" "}
            +{metric.today.toLocaleString()} today
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-3xl font-black text-ink-dim">—</p>
          <p className="mt-2 text-xs text-ink-dim">
            Connect Google Analytics to see this.
          </p>
        </>
      )}
    </div>
  );
}
