import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewBadge } from "./NewBadge";

describe("NewBadge", () => {
  it("shows for an item added just now", () => {
    render(<NewBadge createdAt={new Date().toISOString()} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("is absent for an item older than a week", () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    render(<NewBadge createdAt={old} />);
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });
});
