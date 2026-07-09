import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminTypesPage } from "./AdminTypesPage";
import type { GameType } from "../../api/types";

const types: GameType[] = [{ id: "t1", name: "Thunder", iconUrl: null }];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(types), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminTypesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminTypesPage", () => {
  it("lists types with actions", async () => {
    renderPage();
    expect(await screen.findByText("Thunder")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New type" })).toBeInTheDocument();
  });

  it("delete confirm explains the in-use block", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/still uses/)).toBeInTheDocument();
  });
});
