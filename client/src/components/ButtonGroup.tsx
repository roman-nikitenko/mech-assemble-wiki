import type { ReactNode } from "react";

export interface ButtonGroupOption {
  value: string;
  label: string;
  /** Small icon shown left of the label — e.g. a type <img>, an <STierIcon />. */
  icon?: ReactNode;
}

interface ButtonGroupProps {
  options: ButtonGroupOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the whole group (the <div role="group">). */
  ariaLabel?: string;
  /** Prefix for each button's accessible name, e.g. "Type" → "Type Fire".
      Falls back to the option label alone when omitted. */
  labelPrefix?: string;
  /** Show only the icon (label becomes the accessible name). Options without
      an icon still fall back to their text so they're never blank. */
  iconOnly?: boolean;
  /** Clicking the already-selected option clears it (onChange("")), so a group
      with nothing selected means "no filter / show all". */
  toggleable?: boolean;
  /** Extra classes on the wrapper (e.g. layout tweaks). */
  className?: string;
}

/** Segmented single-select buttons — a drop-in alternative to <Dropdown> for
    small option sets you want visible at once. Active = accent fill; idle =
    muted with an accent hover. Mirrors the Dropdown option shape so the two
    are interchangeable. */
export function ButtonGroup({
  options,
  value,
  onChange,
  ariaLabel,
  labelPrefix,
  iconOnly = false,
  toggleable = false,
  className = "",
}: ButtonGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        // Hide the text only when we're in icon-only mode AND actually have an
        // icon to show — otherwise the button would be blank.
        const showLabel = !iconOnly || !opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            aria-label={labelPrefix ? `${labelPrefix} ${opt.label}` : opt.label}
            aria-pressed={active}
            onClick={() => onChange(toggleable && active ? "" : opt.value)}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
              active
                ? "border-accent bg-accent/15 text-accent"
                : "border-edge text-ink-dim hover:border-accent/50"
            }`}
          >
            {opt.icon && (
              <span aria-hidden="true" className="flex shrink-0">
                {opt.icon}
              </span>
            )}
            {showLabel && opt.label}
          </button>
        );
      })}
    </div>
  );
}
