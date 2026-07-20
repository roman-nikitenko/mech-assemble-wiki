import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { imageSrc, useMechs, usePostedBuilds, useWeapons } from "../api/client";
import { useMe } from "../auth/useMe";
import { useDeletePostedBuild, useToggleHeart } from "../auth/useBuilds";
import { AuthorTag } from "../profile/AuthorTag";
import { noteExcerpt } from "../profile/noteMarkup";
import { formatDate } from "../lib/date";
import { ShareButton } from "../profile/ShareButton";

/** Public community build feed. Shows all builds posted by any user. */
export function BuildsPage() {
  const { isAuthenticated } = useAuth0();
  const me = useMe();
  const posted = usePostedBuilds();
  const deleteBuild = useDeletePostedBuild();
  const toggleHeart = useToggleHeart();
  const mechs = useMechs({});
  const weapons = useWeapons();
  const mechById = new Map((mechs.data ?? []).map((m) => [m.id, m]));
  const weaponById = new Map((weapons.data ?? []).map((w) => [w.id, w]));

  const builds = posted.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="text-xl font-bold">Builds</h2>
      <p className="mb-4 mt-1 text-xs text-ink-dim">
        Community builds — post your own from{" "}
        <Link to="/profile" className="text-accent underline">
          My Profile
        </Link>
        .
      </p>
      {posted.isPending ? (
        <p className="mt-8 text-center text-ink-dim">Loading…</p>
      ) : builds.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">
          No builds posted yet — be the first!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {builds.map((b) => {
            const mech = b.mechId ? mechById.get(b.mechId) : undefined;
            const weapon = b.weaponId ? weaponById.get(b.weaponId) : undefined;
            const image = mech?.imageUrl ?? weapon?.iconUrl ?? weapon?.imageUrl;
            const excerpt = noteExcerpt(b.description);
            const isOwn = !!me.data && b.author.nickname === me.data.nickname;
            return (
              <div key={b.id} className="rounded-xl border border-edge bg-surface p-4 flex gap-3">
                {image && (
                  <Link to={`/builds/${b.id}`} className="shrink-0">
                    <img
                      src={imageSrc(image)}
                      alt=""
                      className="h-32 w-24 rounded-lg border border-edge object-cover"
                    />
                  </Link>
                )}
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <Link to={`/builds/${b.id}`} className="font-bold hover:text-accent">
                    {b.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-dim">
                    by{" "}
                    <AuthorTag
                      nickname={b.author.nickname}
                      server={b.author.server}
                    />{" "}
                    · updated {formatDate(b.updatedAt)}
                  </p>
                  {excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-dim">{excerpt}</p>
                  )}
                  <div className="mt-auto pt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={!isAuthenticated || toggleHeart.isPending}
                      title={isAuthenticated ? undefined : "Sign in to like"}
                      onClick={() => isAuthenticated && toggleHeart.mutate(b.id)}
                      className="flex min-h-9 items-center gap-1.5 rounded-lg border border-edge px-3 text-sm hover:bg-surface-2 disabled:cursor-default disabled:opacity-60"
                    >
                      <span className={b.userHearted ? "text-fire" : "text-ink-dim"}>♥</span>
                      {b.hearts}
                    </button>
                    <ShareButton buildId={b.id} />
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Remove this build from the community feed?")) {
                            deleteBuild.mutate(b.id);
                          }
                        }}
                        className="flex min-h-9 items-center rounded-lg border border-fire/40 px-3 text-sm text-fire hover:bg-fire/10"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
