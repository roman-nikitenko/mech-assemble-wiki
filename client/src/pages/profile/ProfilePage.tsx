import { useState } from "react";
import { Link } from "react-router-dom";
import { deleteBuild, listBuilds } from "../../profile/buildStorage";

/** The visitor's profile: a table of their builds. Builds are LOCAL to
    this browser (no accounts yet). The Post action is a placeholder —
    publishing builds to the public Builds tab needs real accounts first. */
export function ProfilePage() {
  const [builds, setBuilds] = useState(() => listBuilds());

  function remove(id: string) {
    if (!window.confirm("Delete this build?")) return;
    deleteBuild(id);
    setBuilds(listBuilds());
  }

  const btnCls = "min-h-9 rounded-lg border px-3 text-sm";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">My Profile</h2>
        <Link
          to="/profile/builds/new"
          className="flex min-h-11 items-center rounded-lg bg-accent px-4 font-semibold text-bg hover:brightness-110"
        >
          + New build
        </Link>
      </div>
      <p className="mb-4 text-xs text-ink-dim">
        Builds are saved in this browser only — accounts come later.
      </p>
      {builds.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">
          No builds yet — create your first one!
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-edge">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-ink-dim">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {builds.map((b) => (
                <tr key={b.id} className="border-t border-edge bg-surface">
                  <td className="px-4 py-3">
                    <Link
                      to={`/profile/builds/${b.id}/edit`}
                      className="font-semibold hover:text-accent"
                    >
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-dim">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/profile/builds/${b.id}/edit`}
                        className={`${btnCls} flex items-center border-edge hover:border-accent/60`}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled
                        title="Posting builds publicly is coming soon"
                        className={`${btnCls} border-edge text-ink-dim opacity-60`}
                      >
                        Post
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(b.id)}
                        className={`${btnCls} border-fire/40 text-fire hover:bg-fire/10`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
