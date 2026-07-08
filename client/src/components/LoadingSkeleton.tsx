/** Pulsing gray placeholders shown while a query is pending. */
export function LoadingSkeleton({ variant }: { variant: "cards" | "detail" }) {
  const count = variant === "cards" ? 8 : 4;
  return (
    <div
      className={
        variant === "cards"
          ? "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "mt-4 space-y-3"
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}
