import { useSearchParams } from "react-router-dom";
import type { Chip } from "../../api/types";
import { chipIcon, chipPartIcon } from "../../lib/chipArt";
import { CHIP_CATEGORIES, CHIP_QUALITIES, chipQualityTextStyle } from "../../lib/chipQualities";
import { ChipDetail } from "./ChipDetail";

const DEFAULT_QUALITY = 5; // Rare — what the reference page opens on

/** "Chip browser": pick a body part, pick a quality, read the card. The choice
    lives in the URL (?part=head&q=5) so a view can be shared and survives reload. */
export function ChipBrowser({ chips }: { chips: Chip[] }) {
  const [params, setParams] = useSearchParams();

  // One chip per category by convention; the first one in list order wins.
  const byCategory = new Map(chips.map((c) => [c.category, c] as const).reverse());
  const tabs = CHIP_CATEGORIES.filter((c) => byCategory.has(c.category));

  const active = tabs.find((t) => t.slug === params.get("part")) ?? tabs[0];
  const qParam = Number(params.get("q"));
  const quality = CHIP_QUALITIES.some((q) => q.quality === qParam) ? qParam : DEFAULT_QUALITY;

  if (!active) return <p className="mt-8 text-center text-ink-dim">No chips recorded yet.</p>;
  const chip = byCategory.get(active.category)!;

  // replace: switching tabs shouldn't fill the back button with every click.
  const select = (part: string, q: number) => setParams({ part, q: String(q) }, { replace: true });

  // Arrow keys move between tabs, as the tablist role promises.
  function onTabKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    select(next.slug, quality);
    document.getElementById(`chip-tab-${next.slug}`)?.focus();
  }

  return (
    <section aria-labelledby="chip-browser" className="grid gap-4">
      <h2 id="chip-browser" className="flex items-baseline gap-2.5 text-xl font-semibold">
        Chip browser <small className="font-mono text-xs uppercase tracking-wider text-ink-dim">pick a part and a quality</small>
      </h2>

      <div role="tablist" aria-label="Chip part" className="flex flex-wrap gap-2">
        {tabs.map((t, i) => {
          const selected = t.slug === active.slug;
          const icon = chipPartIcon(t.category);
          return (
            <button
              key={t.slug}
              id={`chip-tab-${t.slug}`}
              role="tab"
              type="button"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.slug, quality)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-1.5 text-sm font-semibold ${
                selected ? "border-accent bg-accent/10 text-ink" : "border-edge bg-surface text-ink-dim hover:text-ink"
              }`}
            >
              {icon && <img src={icon} alt="" className="h-[26px] w-[30px] object-contain" />}
              {t.category}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-9">
        {CHIP_QUALITIES.map((q) => {
          const pressed = q.quality === quality;
          const icon = chipIcon(chip.category, q.quality);
          return (
            <button
              key={q.quality}
              type="button"
              aria-pressed={pressed}
              aria-label={q.name}
              onClick={() => select(active.slug, q.quality)}
              className={`grid cursor-pointer justify-items-center gap-0.5 rounded-xl border px-0.5 pb-1 pt-1.5 font-mono text-[11px] ${
                pressed ? "border-edge bg-surface text-ink" : "border-transparent text-ink-dim hover:text-ink"
              }`}
            >
              {icon && <img src={icon} alt="" className="aspect-square w-full max-w-16 object-contain" />}
              <span style={pressed ? chipQualityTextStyle(q.quality) : undefined}>{q.name}</span>
            </button>
          );
        })}
      </div>

      <ChipDetail chip={chip} quality={quality} />
    </section>
  );
}
