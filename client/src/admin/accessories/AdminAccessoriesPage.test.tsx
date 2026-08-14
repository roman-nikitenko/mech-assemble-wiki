import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminAccessoriesPage } from "./AdminAccessoriesPage";
import type { AccessorySummary } from "../../api/types";

const accessories: AccessorySummary[] = [
  {
    id: "a1",
    name: "Shadow Pendant",
    tier: "S",
    attributes: [{ name: "HP", value: "42k" }],
    exclusiveEffect: "Crit hits restore 1% HP",
    imageUrl: null,
    iconUrl: null,
    mech: { id: "m1", slug: "shadow-warrior", name: "Shadow Warrior", iconUrl: null },
  },
  {
    id: "a2",
    name: "Iron Band",
    tier: "Standard",
    attributes: [{ name: "DEF", value: "200" }],
    exclusiveEffect: null,
    imageUrl: null,
    iconUrl: null,
    mech: null,
  },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(accessories), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminAccessoriesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminAccessoriesPage", () => {
  it("lists accessories with tier and linked mech", async () => {
    renderPage();
    expect(await screen.findByText("Shadow Pendant")).toBeInTheDocument();
    // S-tier badge in the row (scoped to the table — the tier filter button in
    // the header also renders an S-tier icon).
    expect(within(screen.getByRole("table")).getByLabelText("S-tier")).toBeInTheDocument();
    expect(screen.getByText("Shadow Warrior")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New accessory" })).toBeInTheDocument();
  });

  it("filters the list by name search", async () => {
    renderPage();
    expect(await screen.findByText("Shadow Pendant")).toBeInTheDocument();
    expect(screen.getByText("Iron Band")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Search by name"), "iron");
    expect(screen.queryByText("Shadow Pendant")).not.toBeInTheDocument();
    expect(screen.getByText("Iron Band")).toBeInTheDocument();
  });
});
