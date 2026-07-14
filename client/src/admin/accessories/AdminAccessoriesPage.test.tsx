import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
    mech: { id: "m1", name: "Shadow Warrior" },
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
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("Shadow Warrior")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New accessory" })).toBeInTheDocument();
  });
});
