import { isNewItem } from "../lib/isNewItem";
import ribbon from "../assets/new-ribbon.png";

// Red ribbon with "New" for a card's top-left corner, shown for a week after
// the item was added. Renders nothing otherwise, so cards can include it
// unconditionally. The parent card must be `relative`.
export function NewBadge({ createdAt }: { createdAt: string }) {
  if (!isNewItem(createdAt)) return null;
  return (
    <span
      // The ribbon art is 312x94; w-[76px] h-[23px] keeps that ratio. Its right
      // end is a swallowtail notch, so pr-2.5 centres the text on the solid
      // part. The ribbon sits flush with the card's left edge (its folded tab
      // is meant to tuck behind the card).
      className="pointer-events-none absolute top-[-7px] left-[-5px] z-20 flex h-[23px] w-[76px] items-center justify-center bg-[length:100%_100%] bg-no-repeat pr-2.5 text-[11px] font-black uppercase leading-none tracking-wide text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
      style={{ backgroundImage: `url(${ribbon})` }}
    >
      New
    </span>
  );
}
