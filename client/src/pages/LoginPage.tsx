import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

/** Our own branded sign-in page. Each button is a full-page redirect into
    the provider flow (window.location via useAuth().login). */
export function LoginPage() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const error = params.get("error");

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-black">Sign in</h1>
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
          className="min-h-11 rounded bg-white font-semibold text-black hover:brightness-95"
        >
          Sign in with Google
        </button>
        <button
          type="button"
          onClick={() => login("discord")}
          className="min-h-11 rounded bg-[#5865F2] font-semibold text-white hover:brightness-110"
        >
          Sign in with Discord
        </button>
      </div>
    </main>
  );
}
