import type { CSSProperties } from "react";

export function STierIcon({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
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
      }}
    >
      <span aria-hidden="true" style={{ ...starSquare, transform: "translate(-50%, -50%) rotate(45deg)" }} />
      <span
        className="relative font-nasalization font-bold italic leading-none"
        style={{
          fontSize: size * 0.95,
          color: "#FEE050",
          textShadow:
            "0 0 5px rgba(255,205,70,.95), 0 0 4px rgba(255,170,40,.8), 0 1px 1px rgba(90,40,0,.6)",
        }}
      >
        S
      </span>
    </span>
  );
}
