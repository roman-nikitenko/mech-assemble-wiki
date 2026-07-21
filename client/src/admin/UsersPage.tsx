import { useAdminUsers, useDeleteUser } from "../api/client";
import { formatDate } from "../lib/date";

/** Admin Users list — real registered accounts from the DB. "Name" is the
    Auth0 display name captured at login (dash until the user next signs in
    after this shipped). Deleting a user cascades away their builds + hearts. */
export function UsersPage() {
  const users = useAdminUsers();
  const deleteUser = useDeleteUser();

  function remove(id: string, label: string) {
    if (!window.confirm(`Delete ${label}? This also removes all their builds.`)) return;
    deleteUser.mutate(id);
  }

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">Users</h1>

      {users.isPending ? (
        <p className="mt-6 text-ink-dim">Loading…</p>
      ) : users.isError ? (
        <p className="mt-6 text-fire">{(users.error as Error).message}</p>
      ) : users.data.length === 0 ? (
        <p className="mt-6 text-ink-dim">No registered users yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-surface text-ink-dim">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Server</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Builds</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((u) => (
                <tr key={u.id} className="border-t border-edge">
                  <td className="px-4 py-3 font-semibold">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-dim">{u.server ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-dim">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">{u.buildCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={deleteUser.isPending}
                      onClick={() => remove(u.id, u.name ?? u.nickname ?? "this user")}
                      className="rounded border border-fire/40 px-2 py-1 text-xs text-fire hover:bg-fire/10 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleteUser.isError && (
        <p className="mt-3 text-sm text-fire">{(deleteUser.error as Error).message}</p>
      )}
    </div>
  );
}
