import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BuildsPage } from "./BuildsPage";
import type { PostedBuild } from "../api/types";
import { formatDate } from "../lib/date";

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

const BUILD: PostedBuild = {
  id: "b1",
  name: "Zap rush",
  description: "## Plan\nGo **fast** with #[Iron Colossus]",
  mechId: "m1",
  weaponId: null,
  skillIds: [],
  weaponIds: [],
  weaponSkillIds: {},
  hearts: 5,
  status: "Published",
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: new Date().toISOString(),
  author: { nickname: "BanzaiFun", server: "EU-7" },
};

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/api/me")) {
      return new Response(
        JSON.stringify({ id: "u1", nickname: "BanzaiFun", server: "EU-7", isNew: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.endsWith("/api/builds")) {
      return new Response(JSON.stringify([BUILD]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/builds"]}>
        <Routes>
          <Route path="/builds" element={<BuildsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  auth0State.isAuthenticated = false;
  auth0State.user = undefined;
});
afterEach(() => vi.restoreAllMocks());

describe("BuildsPage", () => {
  it("shows the empty state when no builds are posted", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/builds")) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/builds"]}>
          <Routes>
            <Route path="/builds" element={<BuildsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(await screen.findByText(/No builds posted yet/)).toBeInTheDocument();
  });

  it("lists builds with name link, author, date, note excerpt; heart enabled when logged in", async () => {
    auth0State.isAuthenticated = true;
    renderPage();
    expect(await screen.findByRole("link", { name: "Zap rush" })).toHaveAttribute(
      "href",
      "/builds/b1"
    );
    // markers stripped in the excerpt
    expect(await screen.findByText(/Plan Go fast with Iron Colossus/)).toBeInTheDocument();
    expect((await screen.findAllByText("BanzaiFun")).length).toBeGreaterThan(0);
    expect(screen.getByText("Server: EU-7")).toBeInTheDocument();
    const dateLine = screen.getByText(/· updated/);
    expect(dateLine.textContent).toContain(formatDate(new Date().toISOString()));
    const heart = screen.getByRole("button", { name: /♥ 5/ });
    expect(heart).toBeEnabled();
  });

  it("heart button is disabled when not logged in", async () => {
    auth0State.isAuthenticated = false;
    renderPage();
    const heart = await screen.findByRole("button", { name: /♥ 5/ });
    expect(heart).toBeDisabled();
  });

  it("shows Remove button only for own builds", async () => {
    auth0State.isAuthenticated = true;
    renderPage();
    await screen.findByRole("link", { name: "Zap rush" });
    // BanzaiFun is the logged-in user (nickname matches author)
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });
});
