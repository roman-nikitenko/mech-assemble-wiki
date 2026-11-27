import type { ReactNode } from "react";

interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
  /** A tab listed here shows only this icon; its name becomes the accessible label. */
  icons?: Record<string, ReactNode>;
}

/** Minimal accessible tab bar. min-h-11 = 44px tap targets (mobile-first);
    overflow-x-auto lets it scroll sideways on narrow phones. */
export function Tabs({ tabs, active, onChange, icons }: TabsProps) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-edge mb-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-label={icons?.[tab] ? tab : undefined}
          aria-selected={tab === active}
          onClick={() => onChange(tab)}
          className={`flex min-h-11 items-center whitespace-nowrap px-4 text-sm cursor-pointer font-semibold transition-colors ${
            tab === active
              ? "border-b-2 border-accent text-accent"
              : "text-ink-dim hover:text-ink"
          }`}
        >
          {/* aria-hidden: the icon's own label must not compete with the tab name. */}
          {icons?.[tab] ? <span aria-hidden="true" className="flex">{icons[tab]}</span> : tab}
        </button>
      ))}
    </div>
  );
}
