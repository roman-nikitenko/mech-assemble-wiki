import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./PublicLayout";

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<p>mechs grid here</p>} />
          {/* dummy child — BuildsPage has its own test file */}
          <Route path="/builds" element={<p>builds here</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("PublicLayout", () => {
  it("shows all five section tabs with Mechs active on the home page", () => {
    renderAt("/");
    const nav = screen.getByRole("navigation", { name: "Site sections" });
    for (const label of ["Mechs", "Builds", "Weapons", "Accessories", "Pilots"]) {
      expect(nav).toHaveTextContent(label);
    }
    expect(screen.getByRole("link", { name: "Mechs" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Builds" })).not.toHaveAttribute("aria-current");
    expect(screen.getByText("mechs grid here")).toBeInTheDocument();
  });

  it("marks the Builds tab active on /builds", () => {
    renderAt("/builds");
    expect(screen.getByText("builds here")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Builds" })).toHaveAttribute("aria-current", "page");
  });
});
