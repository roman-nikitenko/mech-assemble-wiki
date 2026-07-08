interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

/** Minimal accessible tab bar. min-h-11 = 44px tap targets (mobile-first);
    overflow-x-auto lets it scroll sideways on narrow phones. */
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-edge">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={tab === active}
          onClick={() => onChange(tab)}
          className={`min-h-11 whitespace-nowrap px-4 text-sm font-semibold transition-colors ${
            tab === active
              ? "border-b-2 border-accent text-accent"
              : "text-ink-dim hover:text-ink"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
