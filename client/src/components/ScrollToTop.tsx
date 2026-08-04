import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Resets the window to the top on every route change, instantly (no smooth
    scroll), so a freshly-navigated page always starts at the top instead of
    keeping the previous page's scroll position.

    Skips navigations that carry a hash (e.g. /pilots#pilot-<id>): those target
    a specific element, and the destination page scrolls to it itself. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
