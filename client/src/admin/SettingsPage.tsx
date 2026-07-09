import { MockBadge } from "./MockBadge";

const HINT = "Translations arrive with the i18n cycle — this is a preview of the settings layout.";

export function SettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <MockBadge hint={HINT} />
      </div>
      <section className="mt-6 max-w-md rounded-xl border border-edge bg-surface p-5">
        <h2 className="font-bold">Languages</h2>
        <p className="mt-1 text-sm text-ink-dim">Languages visitors can switch the wiki to.</p>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
            <span>English</span>
            <span className="text-xs font-semibold text-accent">active</span>
          </li>
        </ul>
        <button disabled title={HINT} className="mt-3 min-h-11 rounded-lg border border-edge px-4 text-sm text-ink-dim opacity-60">
          + Add language
        </button>
      </section>
    </div>
  );
}
