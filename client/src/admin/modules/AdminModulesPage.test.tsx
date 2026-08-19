import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminModulesPage } from "./AdminModulesPage";
import type { ModuleSummary } from "../../api/types";

const modules: ModuleSummary[] = [
  {
    id: "mod1",
    name: "Ammo Chain",
    iconUrl: null,
    effect2Target: "Weapon",
    effect3Target: "Weapon",
    effects: [],
  },
];

function renderPage() {
  // mockImplementation (not mockResolvedValue): a Response body can only be
  // read once, so every fetch call needs a FRESH Response object. Branch by
  // URL so only /api/modules returns the fixture; anything else (e.g. a
  // types fetch) returns an empty list.
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/modules") ? modules : [];
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
        <AdminModulesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminModulesPage", () => {
  it("lists modules with a link to edit", async () => {
    renderPage();
    expect(await screen.findByRole("link", { name: "Ammo Chain" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New module" })).toBeInTheDocument();
  });
});
