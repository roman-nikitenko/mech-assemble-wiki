import sIcon from "../assets/tier/s.png";
import ssIcon from "../assets/tier/ss.png";

/** The tier badge, rendered from the game art (assets/tier). Defaults to the
    S badge; pass variant="SS" for the SS badge. The role="img" + aria-label
    wrapper keeps the accessible name callers/tests rely on ("S-tier"). */
export function STierIcon({
  size = 40,
  className = "",
  variant = "S",
}: {
  size?: number;
  className?: string;
  variant?: "S" | "SS";
}) {
  const src = variant === "SS" ? ssIcon : sIcon;
  return (
    <span
      role="img"
      aria-label={`${variant}-tier`}
      className={`inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={src} alt="" className="h-full w-full object-contain" />
    </span>
  );
}
