import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { deleteBuild, listBuilds } from "../../profile/buildStorage";
import { loadProfile, saveProfile } from "../../profile/profileStorage";
import { Tabs } from "../../components/Tabs";
import { SavedToast } from "../../admin/SavedToast";
import { formatDate } from "../../lib/date";

/** The visitor's profile: a table of their builds plus a Settings tab
    (nickname shown as the build author + game server). Everything is
    LOCAL to this browser (no accounts yet). The Post action is a
    placeholder — publishing needs real accounts first. */
export function ProfilePage() {
  const location = useLocation();
  // The build editor redirects here when creating without a nickname —
  // land straight on Settings with the explanation banner.
  const needNickname =
    (location.state as { needNickname?: boolean } | null)?.needNickname ?? false;
  const [builds, setBuilds] = useState(() => listBuilds());
  const [tab, setTab] = useState(needNickname ? "Settings" : "Builds");
  const [profile, setProfile] = useState(() => loadProfile());
  const [saved, setSaved] = useState(false);

  function remove(id: string) {
    if (!window.confirm("Delete this build?")) return;
    deleteBuild(id);
    setBuilds(listBuilds());
  }

  const btnCls = "min-h-9 rounded-lg border px-3 text-sm";
  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <SavedToast show={saved} onHide={() => setSaved(false)} />
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

      <div className="mb-4">
        <Tabs tabs={["Builds", "Settings"]} active={tab} onChange={setTab} />
      </div>

      {tab === "Settings" ? (
        <div className="max-w-md space-y-4">
          {needNickname && (
            <p className="rounded-lg border border-fire/40 bg-fire/10 px-3 py-2 text-sm text-fire">
              You need to fill in a nickname first — every build shows its
              author!
            </p>
          )}
          <p className="text-xs text-ink-dim">
            Shown as the author on your builds — stored in this browser until
            accounts arrive.
          </p>
          <div>
            <label htmlFor="profile-nickname" className="mb-1 block text-sm font-semibold">
              Nickname *
            </label>
            <input
              id="profile-nickname"
              value={profile.nickname}
              onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
              className={fieldCls}
              placeholder="e.g. BanzaiFun"
            />
          </div>
          <div>
            <label htmlFor="profile-server" className="mb-1 block text-sm font-semibold">
              Game server
            </label>
            <input
              id="profile-server"
              value={profile.server}
              onChange={(e) => setProfile({ ...profile, server: e.target.value })}
              className={fieldCls}
              placeholder="e.g. EU-7"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              saveProfile(profile);
              setSaved(true);
            }}
            disabled={profile.nickname.trim() === ""}
            className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
          >
            Save settings
          </button>
        </div>
      ) : builds.length === 0 ? (
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
                    {formatDate(b.createdAt)}
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
