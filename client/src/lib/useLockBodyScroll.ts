import { useEffect } from "react";

/** Freeze the page behind a modal while `locked` is true, restoring whatever
    overflow the body had before. Restoring the PREVIOUS value (rather than
    hardcoding "") keeps nested or stacked modals honest: the inner one puts
    back the outer one's lock instead of releasing the page early. */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
