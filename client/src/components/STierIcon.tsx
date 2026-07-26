import type { CSSProperties } from "react";

/** A pure-CSS recreation of the S-tier mech icon: a glowing gold "S" with a
    dark outline and warm glow, sitting on an 8-point star ("romb") over a
    rounded amber tile. No image asset — everything is drawn with CSS so it
    stays crisp at any size and can be recolored via the values below.

    Everything is sized relative to `size` (px) so the whole badge scales as
    one unit — change `size` and the star, S, stroke, and glow all follow. */
export function STierIcon({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  // One rotated square of the 8-point star. Two of these — offset 45° from
  // each other — overlap to make the 8 points. Beveled with a light-to-dark
  // gradient so it reads as a faceted metal romb.
  // Anchored at the icon's center via top/left 50%; the translate(-50%,-50%)
  // then pulls it back by half its own size so its middle sits dead center.
  // The rotation is appended per-instance below (spreading this object and
  // re-setting `transform` would drop the centering, so they combine there).
  const starSquare: CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "54%",
    width: size * 0.6,
    height: size * 0.6,
    border:"1px solid #B06A1D",
    background: "#714453",
    boxShadow: "inset 0 0 0 1px rgba(120,60,0,.45)",
  };

  return (
    <span
      role="img"
      aria-label="S-tier"
      className={`relative flex justify-center ${className}`}
      style={{
        width: size,
        height: size,
        // Warm radial tile: bright near the top-center, darkening to the
        // corners — the glow the star and S sit in.
        // background: "radial-gradient(circle at 50% 38%, #ffc24d 0%, #d9741c 62%, #7a3c0c 100%)",
        // Faint inner highlight ring, like the original's beveled edge.
        // boxShadow: "inset 0 0 0 1px rgba(255,220,150,.45)",
      }}
    >
      {/* Star layer — two squares, one axis-aligned, one turned 45°. */}
      {/* <span aria-hidden="true" style={{ ...starSquare, transform: "translate(-50%, -50%) rotate(0deg)" }} /> */}
      <span aria-hidden="true" style={{ ...starSquare, transform: "translate(-50%, -50%) rotate(45deg)" }} />

      {/* The S — gold fill, dark outline via -webkit-text-stroke, warm glow
          via text-shadow. Italic + heavy weight matches the source art. */}
      <span
        className="relative font-nasalization font-bold italic leading-none"
        style={{
          fontSize: size * 0.95,
          color: "#FEE050",
          // WebkitTextStroke: `${0.01}px #90420a`,
          textShadow:
            "0 0 5px rgba(255,205,70,.95), 0 0 4px rgba(255,170,40,.8), 0 1px 1px rgba(90,40,0,.6)",
        }}
      >
        S
      </span>
    </span>
  );
}
