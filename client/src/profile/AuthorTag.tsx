/** The build author's name with a hover card (name + game server) — same
    CSS-only pattern as the note mentions. Falls back to "Anonymous" until
    a nickname is set in Profile → Settings. */
export function AuthorTag({ nickname, server }: { nickname: string | null; server: string | null }) {
  const display = !nickname || nickname.trim() === "" ? "Anonymous" : nickname.trim();
  const serverStr = server?.trim() ?? "";
  return (
    <span className="group relative cursor-help font-semibold text-ink">
      {display}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden w-44 -translate-x-1/2 rounded-xl border border-edge bg-surface-2 p-2 text-center shadow-lg group-hover:block">
        <span className="block text-xs font-semibold">{display}</span>
        <span className="block text-[10px] text-ink-dim">
          {serverStr === "" ? "Server not set" : `Server: ${serverStr}`}
        </span>
      </span>
    </span>
  );
}
