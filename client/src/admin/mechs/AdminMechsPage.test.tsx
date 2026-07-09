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
    name: "Shadow Warrior",
    epithet: "Shadow Hunter",
    type: "Thunder",
    rank: "S",
    quality: "Supreme",
    imageUrl: null,
  },
];

function renderPage() {
  // mockImplementation (not mockResolvedValue): a Response body can only be
  // read once, so every fetch call needs a FRESH Response object.
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(mechs), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
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
    expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New mech" })).toBeInTheDocument();
  });

  it("shows the cascade warning before deleting", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/skills, upgrade trees, weapon/)).toBeInTheDocument();
  });
});
