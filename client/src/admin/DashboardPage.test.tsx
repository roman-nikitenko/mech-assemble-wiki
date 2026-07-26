import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "./DashboardPage";
import type { DashboardStats } from "../api/types";

let stats: DashboardStats;

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <DashboardPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  sessionStorage.setItem("mech-wiki:admin-token", "fake-admin-token");
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () =>
      new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardPage", () => {
  it("shows real totals with the sub-numbers for each card", async () => {
    stats = {
      users: { total: 42, last30: 7 },
      posts: { total: 15, last30: 3 },
      visitors: { active30min: 2, today: 88, total: 1904 },
    };
    renderPage();

    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText("+7 in last 30 days")).toBeInTheDocument();
    expect(screen.getByText("1,904")).toBeInTheDocument(); // toLocaleString formatting
    // Visitors: overall big, with the last-30-min + today windows underneath.
    expect(screen.getByText(/2 online now/)).toBeInTheDocument();
    expect(screen.getByText(/\+88 today/)).toBeInTheDocument();
  });

  it("shows a dash for visitors when GA is not configured", async () => {
    stats = {
      users: { total: 5, last30: 1 },
      posts: { total: 2, last30: 0 },
      visitors: null,
    };
    renderPage();

    await screen.findByText("5");
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Connect Google Analytics to see this.")).toBeInTheDocument();
  });
});
