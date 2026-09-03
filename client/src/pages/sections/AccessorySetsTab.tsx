import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { imageSrc, useAccessorySets } from "../../api/client";
import type { AccessorySetPiece } from "../../api/types";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorPanel } from "../../components/ErrorPanel";
import { STierIcon } from "../../components/STierIcon";
import bgImage from "../../assets/dron-quality-border/quality-7.png"

/** Breathing room kept between the open card and the viewport edge, in px. */
const EDGE_GAP = 8;

/** One piece of a set: the art tile, and the card that opens when it's clicked.

    A real <button> rather than a click handler on the <li>, so the popover is
    reachable by keyboard and announced as expandable. Closes on Escape or a
    click anywhere outside — the same pointerdown pattern the shared Dropdown
    uses, so the two behave alike. */
function PieceTile({
  piece,
  setName,
  art,
}: {
  piece: AccessorySetPiece;
  setName: string;
  art: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLLIElement>(null);
  const card = useRef<HTMLDivElement>(null);
  // How far to slide the card sideways to keep it on screen, and whether to
  // open it upward. Horizontally it SHIFTS rather than flips: flipping only
  // offers two anchors, so a tile in the middle of a narrow screen would
  // overflow one edge or the other whichever anchor it picked. Sliding lets it
  // land anywhere in between. Vertically a flip is right — shifting up or down
  // would drag the card over the tile it belongs to.
  const [pos, setPos] = useState({ dx: 0, up: false });

  useLayoutEffect(() => {
    // Reset on close so the next open measures from the default position
    // rather than from wherever the last one ended up.
    if (!open) {
      setPos({ dx: 0, up: false });
      return;
    }
    const el = card.current;
    if (!el) return;
    // useLayoutEffect, not useEffect: this runs before paint, so the
    // correction is invisible instead of a frame of the card hanging
    // off-screen and then jumping.
    const r = el.getBoundingClientRect();

    // Pull it left if it runs past the right edge, then push it right if that
    // (or its natural position) puts it past the left edge. The left check
    // comes second so a card too wide for the viewport stays anchored to the
    // left edge rather than the right, which reads better.
    let dx = 0;
    const overRight = r.right - (window.innerWidth - EDGE_GAP);
    if (overRight > 0) dx = -overRight;
    if (r.left + dx < EDGE_GAP) dx = EDGE_GAP - r.left;

    setPos({ dx, up: r.bottom > window.innerHeight - EDGE_GAP });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <li ref={wrap} className="relative">
      <button
        type="button"
        title={piece.name}
        aria-label={piece.name}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-20 w-20 cursor-pointer items-center gap-2 bg-surface bg-cover bg-no-repeat px-2 py-1 text-sm hover:brightness-110"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        {piece.tier === "S" && (
          <STierIcon size={35} className="absolute -left-3 -top-3 z-10" />
        )}
        {art && (
          <img src={imageSrc(art)} alt="" className="h-16 w-16 object-contain" />
        )}
      </button>

      {open && (
        <div
          ref={card}
          role="dialog"
          aria-label={`${piece.name} details`}
          className={`absolute z-20 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-edge bg-surface p-3 shadow-xl ${
            pos.up ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{ left: pos.dx }}
        >
          <div className="flex items-start gap-3">
            {art && (
              <img
                src={imageSrc(art)}
                alt=""
                className="h-12 w-12 shrink-0 object-contain"
              />
            )}
            <div className="min-w-0">
              <p className="font-bold">{piece.name}</p>
              <p className="text-xs text-ink-dim">{setName}</p>
            </div>
          </div>

          <h4 className="mt-3 text-xs font-semibold text-ink-dim">Basic Attr.</h4>
          {piece.attributes.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {piece.attributes.map((attr, i) => (
                <li
                  key={`${attr.name}-${attr.value}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-bg px-2 py-1 text-sm"
                >
                  <span>{attr.name}</span>
                  <span className="font-mono">{attr.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink-dim">No attributes recorded.</p>
          )}
        </div>
      )}
    </li>
  );
}

/** Public, read-only list of accessory sets — the "Accessory sets" tab on
    /accessories. Distinct from the admin AccessorySetsTab (a stateful
    editor); this one only renders what the API returns. */
export function AccessorySetsTab() {
  const { data, isPending, isError, refetch } = useAccessorySets();

  if (isPending) return <LoadingSkeleton variant="cards" />;
  if (isError) return <ErrorPanel onRetry={() => refetch()} />;
  if (data.length === 0) {
    return <p className="mt-8 text-center text-ink-dim">No accessory sets recorded yet.</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2">
      {data.map((set) => (
        <section
          key={set.id}
          className="flex flex-col rounded-xl border border-edge bg-surface/60 p-4 h-full"
        >
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="text-lg font-bold">{set.name}</h2>
            <span className="text-xs text-ink-dim">
              {set.accessories.length} piece{set.accessories.length === 1 ? "" : "s"}
            </span>
          </div>

          {set.accessories.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {set.accessories.map((a) => {
                const art = a.iconUrl ?? a.imageUrl;
                return (
                  <PieceTile key={a.id} piece={a} setName={set.name} art={art} />
                );
              })}
            </ul>
          )}

          {set.bonus && (
            // A div, not a p: <p> only takes phrasing content, so the browser
            // auto-closes it before the <h4> and the flex classes stop applying.
            <div className="mt-3 flex flex-col text-sm">
              <h4 className="text-ink-dim text-lg font-black">Set bonus: </h4>
              <span className=" font-semibold">{set.bonus}</span>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
