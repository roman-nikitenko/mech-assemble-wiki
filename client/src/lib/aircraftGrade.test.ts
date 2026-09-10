import { describe, expect, it } from "vitest";
import { AIRCRAFT_GRADES, aircraftGradeImage, gradeForQuality } from "./aircraftGrade";

describe("aircraftGradeImage", () => {
  // The real failure mode of a glob is a renamed or missing asset file, which
  // fails silently at runtime — so assert every rung actually resolves.
  it("resolves art for all nine grades", () => {
    for (const grade of AIRCRAFT_GRADES) {
      expect(aircraftGradeImage(grade), `no art for ${grade}`).toBeTruthy();
    }
  });

  it("ignores case and surrounding whitespace", () => {
    expect(aircraftGradeImage("ss")).toBe(aircraftGradeImage("SS"));
    expect(aircraftGradeImage(" a ")).toBe(aircraftGradeImage("A"));
  });

  it("returns undefined for a letter with no art", () => {
    expect(aircraftGradeImage("Z")).toBeUndefined();
    expect(aircraftGradeImage("")).toBeUndefined();
  });
});

describe("gradeForQuality", () => {
  it("gives Q1-Q8 a letter each", () => {
    expect(gradeForQuality("Q1")).toBe("G");
    expect(gradeForQuality("Q2")).toBe("F");
    expect(gradeForQuality("Q7")).toBe("A");
    expect(gradeForQuality("Q8")).toBe("S");
  });

  it("collapses everything above Q8 onto SS", () => {
    expect(gradeForQuality("Q9")).toBe("SS");
    expect(gradeForQuality("Q11")).toBe("SS");
    expect(gradeForQuality("Q13")).toBe("SS");
  });

  it("returns null for a tier off the ladder", () => {
    expect(gradeForQuality("Q14")).toBeNull();
    expect(gradeForQuality("")).toBeNull();
  });
});
