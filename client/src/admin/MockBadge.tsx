/** Marks a page/section as a non-functional preview (honest mockup). */
export function MockBadge({ hint }: { hint: string }) {
  return (
    <span
      title={hint}
      className="inline-block rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent"
    >
      sample data
    </span>
  );
}
