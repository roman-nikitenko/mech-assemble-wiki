import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useLockBodyScroll } from "../lib/useLockBodyScroll";

// Anything a keyboard can land on. type="hidden" is excluded because a hidden
// input matches input:not([disabled]) but cannot take focus — if one sat first
// in the panel, focusing it would be a no-op and the trap's first/last would be
// wrong.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

/** Tabbable controls inside the panel, in document order. The tabIndex >= 0
    filter catches every negative value, not just the tabindex="-1" a selector
    can spell — and it is the single source of truth for both initial focus and
    the trap, so the two can't disagree. */
function tabbable(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0
  );
}

/** A focus-managed modal overlay: focuses its first control on open, keeps Tab
    inside the panel, closes on Escape, and hands focus back to whatever opened
    it. Render it only while open — mounting IS opening, so the effects that set
    up and tear down focus run at the right moments.

    Also owns the body-scroll lock, so callers don't repeat it.

    The app has other hand-rolled overlays predating this; they can move over
    one at a time rather than each re-implementing the focus rules. */
export function Modal({
  label,
  onClose,
  closeOnBackdrop = false,
  panelClassName = "",
  children,
}: {
  /** Accessible name for the dialog. */
  label: string;
  onClose: () => void;
  /** Click outside the panel closes it — for informational modals, not for
      pickers where a stray click would lose the user's place. */
  closeOnBackdrop?: boolean;
  panelClassName?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  useLockBodyScroll(true);

  useEffect(() => {
    // Remember the trigger before moving focus, so closing can restore it.
    returnTo.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // First control, or the panel itself when it holds none.
    (tabbable(panel)[0] ?? panel)?.focus();
    return () => returnTo.current?.focus?.();
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      // Stop here: a parent listening for Escape shouldn't also react.
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = tabbable(panelRef.current);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    // Wrap at both ends so Tab can never reach the page behind the dialog.
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-bg/80 p-4"
      onClick={
        closeOnBackdrop
          ? (e) => {
              if (e.target === e.currentTarget) onClose();
            }
          : undefined
      }
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        // -1 so the panel can hold focus when it contains no controls, without
        // becoming a Tab stop of its own.
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={panelClassName}
      >
        {children}
      </div>
    </div>
  );
}
