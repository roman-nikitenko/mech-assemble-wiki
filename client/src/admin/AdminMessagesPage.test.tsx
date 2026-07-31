import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminMessagesPage } from "./AdminMessagesPage";

const messages = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Ada",
    message: "Hello there",
    read: false,
    createdAt: new Date().toISOString(),
  },
];

function mockFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    if (url.includes("/api/feedback/mark-read")) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    }
    if (url.includes("/api/feedback") && (init?.method ?? "GET") === "GET") {
      return Promise.resolve(new Response(JSON.stringify(messages), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  });
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminMessagesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminMessagesPage", () => {
  it("lists messages and marks them read on open", async () => {
    mockFetch();
    renderPage();
    expect(await screen.findByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    // Opening the page fires mark-read.
    await waitFor(() =>
      expect(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.some((c) =>
          String(c[0]).includes("/api/feedback/mark-read"),
        ),
      ).toBe(true),
    );
  });
});
