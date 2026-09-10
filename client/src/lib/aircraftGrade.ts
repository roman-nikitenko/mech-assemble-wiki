import { AIRCRAFT_QUALITIES } from "./aircraftQualities";

/** The letter badge shown on an aircraft reset-effect slot, lowest→highest. */
export type AircraftGrade = "G" | "F" | "E" | "D" | "C" | "B" | "A" | "S" | "SS";

// The 13 quality rungs collapse onto 9 badges: one letter each for Q1-Q8, then
// SS for everything above Q8. (Confirmed against the game: a "Drone Skill CD
// Speed +41%" roll shows SS, and that group's Q8 ceiling is 40%.)
export const AIRCRAFT_GRADES: AircraftGrade[] = ["G", "F", "E", "D", "C", "B", "A", "S", "SS"];

// Badge art globbed straight from the folder — same approach as QualityIcon and
// droneQualityBorder, so renaming or adding a file needs no edit here.
// `import: "default"` yields each asset's URL string.
const gradeAssets = import.meta.glob("../assets/aircraft-quality/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// ".../ss.png" -> "SS"
const BY_GRADE = new Map<string, string>(
  Object.entries(gradeAssets).map(([path, url]) => [
    (path.split("/").pop() ?? "").replace(/\.png$/, "").toUpperCase(),
    url,
  ])
);

/** The badge image URL for a letter grade, or undefined when no file matches —
    callers fall back to plain text rather than painting a broken image.
    Case- and whitespace-insensitive, so "ss", "SS" and " Ss " all work. */
export function aircraftGradeImage(letter: string): string | undefined {
  return BY_GRADE.get(letter.trim().toUpperCase());
}

/** The letter grade for a quality tier ("Q1" … "Q13"), or null if the tier is
    unknown. Derived from AIRCRAFT_QUALITIES by position so the ladder itself
    stays declared in exactly one place; anything past Q8 clamps to SS. */
export function gradeForQuality(tier: string): AircraftGrade | null {
  const i = AIRCRAFT_QUALITIES.findIndex((q) => q.tier === tier);
  if (i < 0) return null;
  return AIRCRAFT_GRADES[Math.min(i, AIRCRAFT_GRADES.length - 1)];
}
