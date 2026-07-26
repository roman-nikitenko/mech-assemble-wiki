import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
// Vite turns an SVG import into a URL string we can drop into <img src>.
import googleIcon from "../assets/google-icon.svg";
import discordIcon from "../assets/discord.svg";

// These SVGs are single-color (black) glyphs, so a CSS filter recolors them.
// Both chains start with `brightness(0) saturate(100%)` to first flatten the
// glyph to pure black, making the rest of the chain deterministic.
// Google red (#DB4437) — filter can't take a hex, so this is a chain tuned to
// approximate it. Discord — flattens to white to read on the blurple button.
const WHITE_FILTER =
  "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7500%) hue-rotate(217deg) brightness(100%) contrast(111%)";

/** Our own branded sign-in page. Each button is a full-page redirect into
    the provider flow (window.location via useAuth().login). */
export function LoginPage() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const error = params.get("error");

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      {/* This page is standalone (outside PublicLayout), so it carries its own
          site identity — logo + wordmark linking home. Makes clear it's our
          own wiki rather than a page impersonating Google/Discord, which also
          helps avoid "deceptive site" misclassification. */}
      <Link
        to="/"
        className="inline-flex flex-col items-center gap-3"
        aria-label="Mech Assemble Wiki — home"
      >
        <img src="/favicon.svg" alt="" className="h-12 w-12" />
        <span className="text-2xl font-black tracking-tight">
          Mech <span className="text-accent">Assemble</span> Wiki
        </span>
      </Link>

      <h1 className="mt-10 text-2xl font-black">Sign in</h1>
      <p className="mt-2 text-ink-dim">Log in to save and share your builds.</p>
      {error && (
        <p className="mt-4 rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
          Sign-in didn't complete. Please try again.
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => login("google")}
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded bg-white font-semibold text-black hover:brightness-95"
        >
          <img src={googleIcon} alt="" className="h-5 w-5" />
          Sign in with Google
        </button>
        <button
          type="button"
          onClick={() => login("discord")}
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded bg-[#5865F2] font-semibold text-white hover:brightness-110"
        >
          <img src={discordIcon} alt="" className="h-5 w-5" style={{ filter: WHITE_FILTER }} />
          Sign in with Discord
        </button>
      </div>
    </main>
  );
}
