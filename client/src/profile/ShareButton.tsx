import { useEffect, useState } from "react";

/** Icon button that copies the build's public link to the clipboard and
    flashes "Copied!" for a moment. */
export function ShareButton({ buildId }: { buildId: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/builds/${buildId}`);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable (old browser, http) — fail silently.
    }
  }

  return (
    <button
      type="button"
      aria-label="Copy link to this build"
      title="Copy link"
      onClick={copy}
      className="flex min-h-9 items-center rounded-lg border border-edge px-3 text-sm text-ink-dim hover:border-accent/60 hover:text-ink"
    >
      {copied ? <span className="text-xs font-semibold text-accent">Copied!</span> : "🔗"}
    </button>
  );
}
