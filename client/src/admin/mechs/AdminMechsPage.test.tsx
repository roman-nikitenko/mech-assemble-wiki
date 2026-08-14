import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminMechsPage } from "./AdminMechsPage";
import type { MechSummary } from "../../api/types";

const mechs: MechSummary[] = [
  {
    id: "m1",
    slug: "shadow-warrior",
    name: "Shadow Warrior",
    epithet: "Shadow Hunter",
    type: null,
    rank: "S",
    imageUrl: null,
  },
  {
    id: "m2",
    slug: "iron-golem",
    name: "Iron Golem",
    epithet: null,
    type: null,
    rank: "Standard",
    imageUrl: null,
  },
];

function renderPage() {
  // mockImplementation (not mockResolvedValue): a Response body can only be
  // read once, so every fetch call needs a FRESH Response object. Branch by
  // URL so the type-filter fetch (/api/types) stays empty instead of echoing
  // the mech list back as fake types.
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/mechs") ? mechs : [];
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminMechsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminMechsPage", () => {
  it("lists mechs with edit/delete actions", async () => {
    renderPage();
    expect(await screen.findByText("Shadow Warrior")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Edit" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "+ New mech" })).toBeInTheDocument();
  });

  it("filters the list by name search", async () => {
    renderPage();
    expect(await screen.findByText("Shadow Warrior")).toBeInTheDocument();
    expect(screen.getByText("Iron Golem")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Search by name"), "iron");
    expect(screen.queryByText("Shadow Warrior")).not.toBeInTheDocument();
    expect(screen.getByText("Iron Golem")).toBeInTheDocument();
  });

  it("shows the cascade warning before deleting", async () => {
    renderPage();
    const deleteButtons = await screen.findAllByRole("button", { name: "Delete" });
    await userEvent.click(deleteButtons[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/skills, upgrade trees, weapon/)).toBeInTheDocument();
  });
});
