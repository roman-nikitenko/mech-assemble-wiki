import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FinalRaidPage } from "./FinalRaidPage";
import type { ArsenalSet } from "../../api/types";

const sets: ArsenalSet[] = [
  {
    id: "s1",
    name: "Swift Set",
    iconUrl: null,
    twoPieceBonus: "Fire Rate +100%",
    fourPieceBonus: null,
    sortOrder: 0,
  },
];

function renderPage(path = "/admin/final-raid") {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(sets), { status: 200, headers: { "Content-Type": "application/json" } })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <FinalRaidPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("FinalRaidPage", () => {
  it("shows the three tabs with Arsenal selected by default", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: "Arsenal" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Set arsenal" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Hidden achievements" })).toBeInTheDocument();
  });

  it("switches to the Set arsenal tab and lists sets with their bonuses", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: "Set arsenal" }));
    expect(await screen.findByText("Swift Set")).toBeInTheDocument();
    expect(screen.getByText("Fire Rate +100%")).toBeInTheDocument();
    // A missing 4-piece bonus shows a dash rather than an empty cell.
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New set" })).toHaveAttribute(
      "href",
      "/admin/final-raid/sets/new"
    );
  });

  it("opens the tab named in the URL", async () => {
    renderPage("/admin/final-raid?tab=sets");
    expect(screen.getByRole("tab", { name: "Set arsenal" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("Swift Set")).toBeInTheDocument();
  });

  it("falls back to Arsenal for an unknown tab", () => {
    renderPage("/admin/final-raid?tab=nonsense");
    expect(screen.getByRole("tab", { name: "Arsenal" })).toHaveAttribute("aria-selected", "true");
  });

  it("asks for confirmation before deleting a set", async () => {
    renderPage("/admin/final-raid?tab=sets");
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Delete Swift Set?");
  });
});
