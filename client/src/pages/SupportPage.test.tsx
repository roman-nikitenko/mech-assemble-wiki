import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SupportPage } from "./SupportPage";

describe("SupportPage", () => {
  it("links to Patreon safely in a new tab and to the feedback page", () => {
    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Support Mech Assemble Wiki" })).toBeInTheDocument();
    const patreon = screen.getByRole("link", { name: /Support on Patreon/ });
    expect(patreon).toHaveAttribute("href", "https://www.patreon.com/MechAssembleWiki");
    expect(patreon).toHaveAttribute("target", "_blank");
    expect(patreon.getAttribute("rel")).toContain("noopener");
    expect(screen.getByRole("link", { name: "feedback page" })).toHaveAttribute("href", "/feedback");
    expect(screen.getByRole("heading", { name: /Supporters/ })).toBeInTheDocument();
    expect(screen.getByText("Be the first to support the wiki!")).toBeInTheDocument();
    expect(screen.queryByText(/monobank/i)).not.toBeInTheDocument();
  });
});
