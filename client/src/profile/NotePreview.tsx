import type { MechSummary, WeaponSummary } from "../api/types";
import { imageSrc } from "../api/client";
import { parseNote, parseInline, type NoteInline } from "./noteMarkup";

interface NotePreviewProps {
  text: string;
  mechs: MechSummary[];
  weapons: WeaponSummary[];
}

/** A #[Name] mention: colored by what it names (mech = blue, weapon =
    orange); hovering shows a small card with the image. Unknown names
    render as dim literal text — a visible hint that the name has a typo. */
function Mention({
  name,
  mechs,
  weapons,
}: {
  name: string;
  mechs: MechSummary[];
  weapons: WeaponSummary[];
}) {
  const lower = name.toLowerCase();
  const mech = mechs.find((m) => m.name.toLowerCase() === lower);
  const weapon = mech ? undefined : weapons.find((w) => w.name.toLowerCase() === lower);
  if (!mech && !weapon) return <span className="text-ink-dim">#[{name}]</span>;

  const displayName = mech?.name ?? weapon!.name;
  const image = mech ? mech.imageUrl : (weapon!.iconUrl ?? weapon!.imageUrl);
  return (
    <span
      className={`group relative cursor-help font-semibold ${mech ? "text-thunder" : "text-accent"}`}
    >
      {displayName}
      {/* hover card — pure CSS (hidden + group-hover), floats above the text */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden w-40 -translate-x-1/2 rounded-xl border border-edge bg-surface-2 p-2 text-center shadow-lg group-hover:block">
        {image && (
          <img
            src={imageSrc(image)}
            alt={displayName}
            className="mb-1 h-28 w-full rounded-lg object-cover"
          />
        )}
        <span className="block text-xs font-semibold text-ink">{displayName}</span>
        <span className="block text-[10px] text-ink-dim">{mech ? "Mech" : "Weapon"}</span>
      </span>
    </span>
  );
}

function Inline({ part, mechs, weapons }: { part: NoteInline } & Omit<NotePreviewProps, "text">) {
  if (part.kind === "bold") return <strong>{part.text}</strong>;
  if (part.kind === "italic") return <em>{part.text}</em>;
  if (part.kind === "mention") return <Mention name={part.name} mechs={mechs} weapons={weapons} />;
  return <>{part.text}</>;
}

/** Renders note markup (see noteMarkup.ts) as styled elements. Used as the
    live preview in the build editor; the public Builds tab will reuse it. */
export function NotePreview({ text, mechs, weapons }: NotePreviewProps) {
  const blocks = parseNote(text);
  if (blocks.length === 0) return null;
  return (
    <div className="space-y-2 text-sm">
      {blocks.map((block, i) =>
        block.kind === "h2" ? (
          <h2 key={i} className="text-lg font-black tracking-tight">
            {parseInline(block.text).map((part, j) => (
              <Inline key={j} part={part} mechs={mechs} weapons={weapons} />
            ))}
          </h2>
        ) : block.kind === "h3" ? (
          <h3 key={i} className="text-base font-bold">
            {parseInline(block.text).map((part, j) => (
              <Inline key={j} part={part} mechs={mechs} weapons={weapons} />
            ))}
          </h3>
        ) : (
          <p key={i}>
            {block.parts.map((part, j) => (
              <Inline key={j} part={part} mechs={mechs} weapons={weapons} />
            ))}
          </p>
        )
      )}
    </div>
  );
}
