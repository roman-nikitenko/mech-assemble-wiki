import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicLayout } from "./PublicLayout";

// Auth now derives from GET /api/me: logged in = 200 with a user, guest = 401.
const authState = vi.hoisted(() => ({ loggedIn: false }));

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<p>mechs grid here</p>} />
            {/* dummy child — BuildsPage has its own test file */}
            <Route path="/builds" element={<p>builds here</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  authState.loggedIn = false;
  localStorage.clear();
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    if (url.includes("/api/me")) {
      return authState.loggedIn
        ? new Response(
            JSON.stringify({ id: "u1", name: null, nickname: "BanzaiFun", server: "EU-7", isNew: false }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          )
        : new Response(JSON.stringify({ error: "Login required" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
    }
    if (url.includes("/api/auth/logout")) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
});

afterEach(() => vi.restoreAllMocks());

describe("PublicLayout", () => {
  it("shows all five section tabs with Mechs active on the home page", () => {
    renderAt("/");
    const nav = screen.getByRole("navigation", { name: "Site sections" });
    for (const label of ["Mechs", "Builds", "Weapons", "Accessories", "Pilots"]) {
      expect(nav).toHaveTextContent(label);
    }
    expect(screen.getByRole("link", { name: "Mechs" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Builds" })).not.toHaveAttribute("aria-current");
    expect(screen.getByText("mechs grid here")).toBeInTheDocument();
  });

  it("marks the Builds tab active on /builds", () => {
    renderAt("/builds");
    expect(screen.getByText("builds here")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Builds" })).toHaveAttribute("aria-current", "page");
  });

  it("shows a Log in link to /login when logged out", () => {
    renderAt("/");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("shows the nickname and Log out when logged in", async () => {
    authState.loggedIn = true;
    renderAt("/");
    expect(await screen.findByRole("link", { name: "BanzaiFun" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });
});
