import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareButton } from "./ShareButton";

afterEach(() => vi.restoreAllMocks());

describe("ShareButton", () => {
  it("copies the build link and flashes Copied!", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // jsdom has no clipboard — provide one
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<ShareButton buildId="b1" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy link to this build" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/builds/b1"));
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });
});
