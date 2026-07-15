import { useEffect } from "react";

/** Small "Saved" confirmation pinned to the top-right corner. The parent
    flips `show` to true after a successful save; the toast dismisses itself
    after a moment by calling `onHide`. */
export function SavedToast({ show, onHide }: { show: boolean; onHide: () => void }) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onHide, 2500);
    return () => clearTimeout(timer);
  }, [show, onHide]);

  if (!show) return null;
  return (
    <div
      role="status"
      className="fixed right-4 top-4 z-50 rounded-lg border border-accent/60 bg-surface-2 px-4 py-2 text-sm font-semibold shadow-lg"
    >
      ✓ Saved
    </div>
  );
}
