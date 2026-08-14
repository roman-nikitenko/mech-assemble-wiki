import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QualityIcon } from "./QualityIcon";

describe("QualityIcon", () => {
  it("renders a labelled icon per tier", () => {
    render(<QualityIcon tier="Gold" />);
    expect(screen.getByLabelText("Gold")).toBeInTheDocument();
  });
});
