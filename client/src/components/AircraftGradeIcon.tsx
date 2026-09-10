import { aircraftGradeImage, type AircraftGrade } from "../lib/aircraftGrade";

/** Game art for an aircraft reset-effect grade (G → SS). Renders nothing when
    that letter has no art file, the same fallback QualityGem uses.
    (STierIcon covers S/SS elsewhere with two hardcoded imports — once this badge
    has real callers, that component is a candidate to fold in here.) */
export function AircraftGradeIcon({
  grade,
  size = 24,
}: {
  grade: AircraftGrade;
  size?: number;
}) {
  const src = aircraftGradeImage(grade);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      role="img"
      aria-label={grade}
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}
