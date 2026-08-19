import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminModuleQualitiesPage } from "./AdminModuleQualitiesPage";
import type { ModuleQuality } from "../../api/types";

const qualities: ModuleQuality[] = [
  { id: "q1", name: "Gold", iconUrl: null, hp: "100", atk: "10", def: "5", effect1Value: "+30%", effectCount: 2, sortOrder: 0 },
  { id: "q2", name: "Silver", iconUrl: null, hp: "80", atk: "8", def: "4", effect1Value: "+15%", effectCount: 1, sortOrder: 1 },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(qualities), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminModuleQualitiesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminModuleQualitiesPage", () => {
  it("lists module qualities with a name link to the edit route", async () => {
    renderPage();
    expect(await screen.findByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("Silver")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gold" })).toHaveAttribute(
      "href",
      "/admin/module-qualities/q1/edit"
    );
    expect(screen.getByRole("link", { name: "+ New quality" })).toBeInTheDocument();
  });
});
