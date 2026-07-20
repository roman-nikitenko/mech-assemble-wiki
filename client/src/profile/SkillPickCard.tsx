import type { SkillNodeRow } from "../api/types";
import { imageSrc } from "../api/client";
import { skillDisplayName } from "./buildRules";

// Game-card palette, matching the in-game rank-up cards the user provided:
// Normal = blue frame on a dark body, Premium = solid orange, Core follows
// the Premium layout in purple. Each card: name band → image space (empty
// for now) → description → "Lv:" footer. Exported so the build editor's
// slot buttons wear the same skin.
export const SKILL_CARD: Record<
  SkillNodeRow["type"],
  { frame: string; header: string; footer: string }
> = {
  Normal: {
    frame: "border-thunder/70 bg-thunder/10",
    header: "bg-thunder text-bg",
    footer: "border-thunder/40 text-thunder",
  },
  Premium: {
    frame: "border-skill-premium bg-skill-premium/85",
    header: "bg-black/30 text-white",
    footer: "border-black/25 text-white",
  },
  Core: {
    frame: "border-skill-core bg-skill-core/85",
    header: "bg-black/30 text-white",
    footer: "border-black/25 text-white",
  },
};

interface SkillPickCardProps {
  skill: SkillNodeRow;
  state: "available" | "picked" | "locked";
  lockReason?: string | null;
  onClick?: () => void;
  /** The chosen mech's card_skill_icon_url — every skill card of a mech
      wears the same art, exactly like the game's rank-up cards. */
  imageUrl?: string | null;
}

/** One game-style skill card in the build editor's palette. A real button:
    disabled (dimmed) when picked or locked. */
export function SkillPickCard({ skill, state, lockReason, onClick, imageUrl }: SkillPickCardProps) {
  const card = SKILL_CARD[skill.type];
  return (
    // min-h-80 = the 320px card height the design asks for.
    // Picked cards stay clickable — a second click un-picks; only locked
    // cards are truly disabled.
    <button
      type="button"
      onClick={onClick}
      disabled={state === "locked"}
      className={`relative flex min-h-80 flex-col gap-2 rounded-xl border-2 p-2 text-center transition ${card.frame} ${
        state === "available"
          ? "hover:brightness-110"
          : state === "picked"
            ? "opacity-60 hover:opacity-90"
            : ""
      }`}
    >
      {/* locked cards sit behind a gray mask; the reason stays on top */}
      {state === "locked" && (
        <span aria-hidden="true" className="absolute inset-0 rounded-[10px] bg-bg/60" />
      )}
      <span
        className={`rounded-lg px-2 py-1 text-sm font-black tracking-tight ${card.header} ${
          skill.type === "Core" ? "italic" : ""
        }`}
      >
        {skillDisplayName(skill)}
      </span>
      {/* image space: the mech's card art when it has one, empty otherwise */}
      {imageUrl ? (
        <img src={imageSrc(imageUrl)} alt="" className="h-20 w-full object-contain" />
      ) : (
        <span aria-hidden="true" className="h-20" />
      )}
      {skill.description && (
        <span className="px-1 text-sm font-semibold">{skill.description}</span>
      )}
      {state === "picked" && (
        <span className="text-xs text-accent">✓ in build — tap to remove</span>
      )}
      {state === "locked" && lockReason && (
        <span className="relative z-10 text-xs font-semibold text-fire">{lockReason}</span>
      )}
      <span className={`mt-auto border-t pt-1 text-sm font-bold ${card.footer}`}>
        Lv: {skill.appearanceLevel}
      </span>
    </button>
  );
}
