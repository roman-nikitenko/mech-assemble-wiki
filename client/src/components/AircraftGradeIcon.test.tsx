import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AircraftGradeIcon } from "./AircraftGradeIcon";

describe("AircraftGradeIcon", () => {
  it("labels the badge with its grade", () => {
    render(<AircraftGradeIcon grade="A" />);
    expect(screen.getByLabelText("A")).toBeInTheDocument();
  });

  it("renders the SS badge", () => {
    render(<AircraftGradeIcon grade="SS" />);
    const img = screen.getByLabelText("SS");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src");
  });

  it("renders nothing when the grade has no art", () => {
    // Cast: the point is what happens if bad data reaches it at runtime.
    const { container } = render(<AircraftGradeIcon grade={"Z" as never} />);
    expect(container).toBeEmptyDOMElement();
  });
});
