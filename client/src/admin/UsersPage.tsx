import { MockBadge } from "./MockBadge";

const SAMPLE_USERS = [
  { name: "ZombieSlayer99", email: "slayer@example.com", joined: "2026-05-02", posts: 14 },
  { name: "MechaFan", email: "mecha.fan@example.com", joined: "2026-05-17", posts: 6 },
  { name: "PilotKael", email: "kael@example.com", joined: "2026-06-01", posts: 22 },
];

const INERT_HINT = "Activates when user accounts exist (future phase).";

export function UsersPage() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black tracking-tight">Users</h1>
        <MockBadge hint={INERT_HINT} />
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-surface text-ink-dim">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Posts</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_USERS.map((u) => (
              <tr key={u.email} className="border-t border-edge">
                <td className="px-4 py-3 font-semibold">{u.name}</td>
                <td className="px-4 py-3 text-ink-dim">{u.email}</td>
                <td className="px-4 py-3 text-ink-dim">{u.joined}</td>
                <td className="px-4 py-3">{u.posts}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button disabled title={INERT_HINT} className="rounded border border-edge px-2 py-1 text-xs text-ink-dim opacity-60">
                      Hide posts
                    </button>
                    <button disabled title={INERT_HINT} className="rounded border border-fire/40 px-2 py-1 text-xs text-fire opacity-60">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
