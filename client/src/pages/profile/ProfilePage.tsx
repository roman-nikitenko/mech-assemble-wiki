import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { clearLocalBuilds, listBuilds } from "../../profile/buildStorage";
import { useMe, useUpdateMe } from "../../auth/useMe";
import {
  useCreateBuild,
  useDeletePostedBuild,
  useMyBuilds,
  usePublishBuild,
  useUnpostBuild,
} from "../../auth/useBuilds";
import type { PostedBuild } from "../../api/types";
import { Tabs } from "../../components/Tabs";
import { SavedToast } from "../../admin/SavedToast";
import { formatDate } from "../../lib/date";

/** The visitor's profile: a table of their builds plus a Settings tab
    (nickname shown as the build author + game server). Requires Auth0
    login — logged-out visitors see a prompt instead. */
export function ProfilePage() {
  const location = useLocation();
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const me = useMe();
  const updateMe = useUpdateMe();
  const myBuilds = useMyBuilds();
  const createBuild = useCreateBuild();
  const publishBuild = usePublishBuild();
  const unpostBuild = useUnpostBuild();
  const deletePostedBuild = useDeletePostedBuild();

  // The build editor redirects here when creating without a nickname —
  // land straight on Settings with the explanation banner.
  const needNickname =
    (location.state as { needNickname?: boolean } | null)?.needNickname ?? false;
  const [tab, setTab] = useState(needNickname ? "Settings" : "Builds");
  const [form, setForm] = useState({ nickname: "", server: "" });
  const [saved, setSaved] = useState(false);

  // One-time migration: import any builds this browser saved before builds
  // moved server-side, then clear the local copy so it never runs twice.
  // Legacy builds come in as Drafts (publishing is now a separate step).
  const migratedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || migratedRef.current) return;
    const userId = user?.sub ?? null;
    const legacy = [...listBuilds(userId), ...listBuilds(null)];
    if (legacy.length === 0) return;
    migratedRef.current = true;
    (async () => {
      for (const b of legacy) {
        await createBuild.mutateAsync({
          name: b.name,
          description: b.description,
          mechId: b.mechId,
          weaponId: b.weaponId,
          skillIds: b.skillIds,
          weaponIds: b.weaponIds,
          weaponSkillIds: b.weaponSkillIds,
        });
      }
      clearLocalBuilds(userId);
      clearLocalBuilds(null);
    })();
  }, [isAuthenticated, user, createBuild]);

  // Seed the form ONCE per page visit. Without the ref, the refetch after a
  // successful save would re-fire this effect and silently overwrite
  // anything the user typed in the meantime.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!me.data || seededRef.current) return;
    seededRef.current = true;
    // one-time legacy read (module deleted — raw key on purpose)
    let legacy: { nickname?: string; server?: string } | null = null;
    try {
      legacy = JSON.parse(localStorage.getItem("mech-wiki:profile") ?? "null");
    } catch {
      legacy = null;
    }
    // Discord logins carry a game-ish handle worth prefilling; Google gives
    // a real name, which we deliberately do NOT default into a public field.
    const discordName = user?.sub?.includes("discord") ? (user?.nickname ?? "") : "";
    setForm({
      nickname: me.data.nickname ?? legacy?.nickname ?? discordName,
      server: me.data.server ?? legacy?.server ?? "",
    });
  }, [me.data, user]);

  function remove(id: string) {
    if (!window.confirm("Delete this build?")) return;
    deletePostedBuild.mutate(id);
  }

  const btnCls = "min-h-9 rounded-lg border px-3 text-sm";
  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";

  // Logged-out gate — placed after all hooks so hook order is always stable.
  if (!isLoading && !isAuthenticated) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold">My Profile</h2>
        <p className="mt-2 text-ink-dim">Log in to manage your builds and settings.</p>
        <button
          type="button"
          onClick={() => loginWithRedirect()}
          className="mt-4 min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110"
        >
          Log in
        </button>
      </main>
    );
  }

  const builds = myBuilds.data ?? [];

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
        Post a build to share it in the community feed. Posted builds can be
        unposted anytime.
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
            Shown as the author on your builds — saved to your account.
          </p>
          <div>
            <label htmlFor="profile-nickname" className="mb-1 block text-sm font-semibold">
              Nickname *
            </label>
            <input
              id="profile-nickname"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
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
              value={form.server}
              onChange={(e) => setForm({ ...form, server: e.target.value })}
              className={fieldCls}
              placeholder="e.g. EU-7"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              updateMe.mutate(form, {
                onSuccess: () => {
                  localStorage.removeItem("mech-wiki:profile"); // legacy copy retired
                  setSaved(true);
                },
              })
            }
            disabled={form.nickname.trim() === "" || updateMe.isPending}
            className="min-h-11 rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
          >
            Save settings
          </button>
          {updateMe.isError && (
            <p className="text-sm text-fire">{(updateMe.error as Error).message}</p>
          )}
        </div>
      ) : myBuilds.isPending ? (
        <p className="mt-8 text-center text-ink-dim">Loading…</p>
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
                      <PostButton
                        build={b}
                        btnCls={btnCls}
                        publishing={publishBuild.isPending}
                        unposting={unpostBuild.isPending}
                        onPublish={() => publishBuild.mutate(b.id)}
                        onUnpost={() => unpostBuild.mutate(b.id)}
                      />
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

/** The publish toggle. Published builds show a green "Posted" button that
    unposts on click; Draft/Unposted builds show a yellow "Post" button that
    publishes — matching the WordPress-style Draft → Published → Unposted flow. */
function PostButton({
  build,
  btnCls,
  publishing,
  unposting,
  onPublish,
  onUnpost,
}: {
  build: PostedBuild;
  btnCls: string;
  publishing: boolean;
  unposting: boolean;
  onPublish: () => void;
  onUnpost: () => void;
}) {
  if (build.status === "Published") {
    return (
      <button
        type="button"
        disabled={unposting}
        title="Click to remove from the community feed"
        onClick={onUnpost}
        className={`${btnCls} border-green-500/60 bg-green-500/10 text-green-400 hover:border-fire/60 hover:bg-fire/10 hover:text-fire`}
      >
        ✓ Posted
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={publishing}
      title="Click to share in the community feed"
      onClick={onPublish}
      className={`${btnCls} border-yellow-500/60 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20`}
    >
      Post
    </button>
  );
}
