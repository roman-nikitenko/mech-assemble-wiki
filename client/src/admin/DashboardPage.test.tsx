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
  it("shows real totals with the last-30-days sub-numbers", async () => {
    stats = {
      users: { total: 42, last30: 7 },
      posts: { total: 15, last30: 3 },
      visitors: { total: 1904, last30: 640 },
    };
    renderPage();

    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText("+7 in last 30 days")).toBeInTheDocument();
    expect(screen.getByText("1,904")).toBeInTheDocument(); // toLocaleString formatting
    expect(screen.getByText("+640 in last 30 days")).toBeInTheDocument();
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
