import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UsersPage } from "./UsersPage";
import type { AdminUser } from "../api/types";

// The list GET returns this — tests mutate it before rendering.
let users: AdminUser[] = [];

const user = (over: Partial<AdminUser> = {}): AdminUser => ({
  id: "u1",
  name: "Kael Voss",
  nickname: "BanzaiFun",
  server: "EU-7",
  createdAt: "2026-07-15T00:00:00.000Z",
  buildCount: 3,
  ...over,
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <UsersPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  users = [];
  sessionStorage.setItem("mech-wiki:admin-token", "fake-admin-token");
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init as RequestInit | undefined)?.method ?? "GET";
    const json = (body: unknown, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    const del = url.match(/\/api\/admin\/users\/([^/]+)$/);
    if (del && method === "DELETE") {
      users = users.filter((u) => u.id !== del[1]);
      return json(null, 204);
    }
    if (url.includes("/api/admin/users")) return json(users);
    return json([]);
  });
});

afterEach(() => vi.restoreAllMocks());

describe("UsersPage", () => {
  it("renders real users with server, joined date and build count", async () => {
    users = [user({ id: "u1", name: "Kael Voss", server: "EU-7", buildCount: 3 })];
    renderPage();
    expect(await screen.findByText("Kael Voss")).toBeInTheDocument();
    expect(screen.getByText("EU-7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    // sends the admin token on the guarded GET
    const getCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((getCall[1] as RequestInit).headers).toMatchObject({
      "x-admin-token": "fake-admin-token",
    });
  });

  it("shows a dash for users who haven't signed in since name capture shipped", async () => {
    users = [user({ id: "u2", name: null, server: null })];
    renderPage();
    expect(await screen.findAllByText("—")).toHaveLength(2); // name + server
  });

  it("shows the empty state when there are no users", async () => {
    renderPage();
    expect(await screen.findByText(/No registered users yet/)).toBeInTheDocument();
  });

  it("deletes a user after confirmation", async () => {
    users = [user({ id: "u1", name: "Doomed User" })];
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.queryByText("Doomed User")).not.toBeInTheDocument()
    );
    expect(screen.getByText(/No registered users yet/)).toBeInTheDocument();
  });

  it("does not delete when the confirm is dismissed", async () => {
    users = [user({ id: "u1", name: "Safe User" })];
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByText("Safe User")).toBeInTheDocument();
    const deleteCalled = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.some(
      ([, init]) => (init as RequestInit | undefined)?.method === "DELETE"
    );
    expect(deleteCalled).toBe(false);
  });
});
