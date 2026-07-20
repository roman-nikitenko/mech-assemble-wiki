import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicLayout } from "./PublicLayout";

const auth0State = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  user: undefined as { sub?: string; nickname?: string } | undefined,
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
  getAccessTokenSilently: vi.fn().mockResolvedValue("fake-token"),
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => auth0State,
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
}));

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
  auth0State.isAuthenticated = false;
  localStorage.clear();
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    const body = JSON.stringify(
      url.includes("/api/me")
        ? { id: "u1", nickname: "BanzaiFun", server: "EU-7", isNew: false }
        : [],
    );
    return new Response(body, {
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

  it("shows Log in when logged out", () => {
    renderAt("/");
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("shows the nickname and Log out when logged in", async () => {
    auth0State.isAuthenticated = true;
    renderAt("/");
    expect(await screen.findByRole("link", { name: "BanzaiFun" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });
});
