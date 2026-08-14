import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  /** Small icon shown left of the label (in the row AND the trigger when
      selected) — e.g. a <QualityIcon />, a type <img>, an emoji. */
  icon?: ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Shown in the trigger when nothing is selected. */
  placeholder?: string;
  /** When true, opening reveals a text box that filters options by label. */
  searchable?: boolean;
  /** Accessible name for the control (replaces a <select>'s aria-label). */
  ariaLabel?: string;
  disabled?: boolean;
  /** Extra classes on the outer wrapper. */
  className?: string;
}

const TRIGGER =
  "min-h-11 w-full cursor-pointer rounded-lg border border-edge bg-surface px-3 text-sm";

/** Reusable single-select dropdown: optional per-option icon, optional
    type-to-filter search, keyboard navigation, and close on outside click /
    Escape. A drop-in for a native <select> across the app. */
export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchable = false,
  ariaLabel,
  disabled = false,
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    if (!searchable || query.trim() === "") return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchable, query]);

  // Close when clicking anywhere outside the control.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Focus the search box when a searchable dropdown opens.
  useEffect(() => {
    if (open && searchable) inputRef.current?.focus();
  }, [open, searchable]);

  function openMenu() {
    if (disabled) return;
    setQuery("");
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setQuery("");
  }
  function pick(opt: DropdownOption) {
    onChange(opt.value);
    close();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) pick(opt);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {searchable && open ? (
        <input
          ref={inputRef}
          aria-label={ariaLabel}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={selected?.label ?? placeholder}
          className={TRIGGER}
        />
      ) : (
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={onKeyDown}
          className={`${TRIGGER} flex items-center justify-between gap-2 disabled:cursor-default disabled:opacity-60`}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {selected?.icon && (
              <span aria-hidden="true" className="flex shrink-0">
                {selected.icon}
              </span>
            )}
            <span className={selected ? "" : "text-ink-dim"}>
              {selected?.label ?? placeholder}
            </span>
          </span>
          <span aria-hidden="true" className="text-ink-dim">
            ▾
          </span>
        </button>
      )}

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-edge bg-surface shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-dim">No matches</li>
          ) : (
            filtered.map((opt, i) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => pick(opt)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm ${
                    i === active ? "bg-accent/15 text-accent" : "hover:bg-surface-2"
                  } ${opt.value === value ? "font-semibold" : ""}`}
                >
                  {opt.icon && (
                    <span aria-hidden="true" className="flex shrink-0">
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
