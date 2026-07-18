import { useState } from "react";
import { Link } from "react-router-dom";
import { imageSrc, useMechs, useWeapons } from "../api/client";
import { listBuilds } from "../profile/buildStorage";
import { loadProfile } from "../profile/profileStorage";
import { AuthorTag } from "../profile/AuthorTag";
import { noteExcerpt } from "../profile/noteMarkup";
import { formatDate } from "../lib/date";
import { ShareButton } from "../profile/ShareButton";

/** Public build list. MVP: builds still live in THIS browser's storage —
    once accounts exist this becomes everyone's builds, and the heart
    button comes alive (only registered users will be able to like). */
export function BuildsPage() {
  const [builds] = useState(() => listBuilds());
  // All local builds share this browser's author until accounts arrive.
  const [profile] = useState(() => loadProfile());
  const mechs = useMechs({});
  const weapons = useWeapons();
  const mechById = new Map((mechs.data ?? []).map((m) => [m.id, m]));
  const weaponById = new Map((weapons.data ?? []).map((w) => [w.id, w]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="text-xl font-bold">Builds</h2>
      <p className="mb-4 mt-1 text-xs text-ink-dim">
        Shown from this browser for now — shared community builds arrive with accounts.
      </p>
      {builds.length === 0 ? (
        <p className="mt-8 text-center text-ink-dim">
          No builds yet — create one in{" "}
          <Link to="/profile" className="text-accent underline">
            My Profile
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {builds.map((b) => {
            const mech = b.mechId ? mechById.get(b.mechId) : undefined;
            const weapon = b.weaponId ? weaponById.get(b.weaponId) : undefined;
            const image = mech?.imageUrl ?? weapon?.iconUrl ?? weapon?.imageUrl;
            const excerpt = noteExcerpt(b.description);
            return (
              <div key={b.id} className="rounded-xl border border-edge bg-surface p-4 flex gap-3">
                {image && (
                  <Link to={`/builds/${b.id}`}>
                    <img
                      src={imageSrc(image)}
                      alt=""
                      className=" h-32 w-full rounded-lg border border-edge object-cover"
                    />
                  </Link>
                )}
                <div className="flex flex-col items-start">
                  <Link to={`/builds/${b.id}`} className="font-bold hover:text-accent">
                    {b.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-dim">
                    by <AuthorTag nickname={profile.nickname} server={profile.server} /> · updated{" "}
                    {formatDate(b.updatedAt)}
                  </p>
                  {excerpt && <p className="mt-1 line-clamp-2 text-sm text-ink-dim">{excerpt}</p>}
                  <div className="mt-3 mt-auto flex gap-2">
                    <button
                      type="button"
                      disabled
                      title="Sign in to like — accounts are coming soon"
                      className="flex min-h-9 items-center gap-1.5 rounded-lg border border-edge px-3 text-sm text-ink-dim opacity-70"
                    >
                      <span className="text-fire">♥</span> {b.hearts}
                    </button>
                    <ShareButton buildId={b.id} />
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
