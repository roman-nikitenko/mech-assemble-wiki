import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { setAdminToken, clearAdminToken } from "../auth/adminSession";

function renderLayout(count: number) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ count }), { status: 200 }),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminLayout />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setAdminToken("test-token")); // AdminLayout redirects without one
afterEach(() => {
  clearAdminToken();
  vi.restoreAllMocks();
});

describe("AdminLayout bell", () => {
  it("shows the unread count when there are unread messages", async () => {
    renderLayout(3);
    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByLabelText(/messages/i)).toBeInTheDocument();
  });

  it("shows no badge number when the count is zero", async () => {
    renderLayout(0);
    // Give the query a tick; the badge number must not appear.
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
