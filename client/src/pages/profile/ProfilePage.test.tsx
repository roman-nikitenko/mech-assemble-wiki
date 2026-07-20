import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfilePage } from "./ProfilePage";
import { saveBuild } from "../../profile/buildStorage";

const auth0State = vi.hoisted(() => ({
  isAuthenticated: true,
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

function renderPage(path = "/profile", state?: Record<string, unknown>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[{ pathname: path, state: state ?? null }]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  auth0State.isAuthenticated = true;
  auth0State.isLoading = false;
  auth0State.user = undefined;
  localStorage.clear();
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    // PUT /api/me — echo the body back
    if (url.includes("/api/me") && (init as RequestInit | undefined)?.method === "PUT") {
      const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ id: "u1", isNew: false, ...body }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    // GET /api/me
    if (url.includes("/api/me")) {
      return new Response(
        JSON.stringify({ id: "u1", nickname: "Tester", server: "EU-1", isNew: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
});

afterEach(() => vi.restoreAllMocks());

describe("ProfilePage", () => {
  it("shows the empty state and a New build link", () => {
    renderPage();
    expect(screen.getByText(/No builds yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New build" })).toHaveAttribute(
      "href",
      "/profile/builds/new"
    );
  });

  it("lists builds as table rows — the name links to the editor", () => {
    saveBuild({
      id: "b1",
      name: "Zap rush",
      description: "",
      mechId: "m1",
      weaponId: null,
      skillIds: ["s1", "s2"],
      weaponIds: [],
      weaponSkillIds: {},
      hearts: 0,
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
    });
    renderPage();
    expect(screen.getByRole("table")).toBeInTheDocument();
    // both the name and the Edit button link to the same editor page
    expect(screen.getByRole("link", { name: "Zap rush" })).toHaveAttribute(
      "href",
      "/profile/builds/b1/edit"
    );
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/profile/builds/b1/edit"
    );
    // Post publishes to the community feed
    expect(screen.getByRole("button", { name: "Post" })).toBeEnabled();
  });

  it("loads settings from the server and saves changes", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: "Settings" }));
    const nick = await screen.findByLabelText("Nickname *");
    await waitFor(() => expect(nick).toHaveValue("Tester"));
    // Save is disabled when the field is empty
    await userEvent.clear(nick);
    expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
    await userEvent.type(nick, "NewName");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(await screen.findByText("✓ Saved")).toBeInTheDocument();
    const putCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === "PUT"
    );
    expect(JSON.parse((putCall![1] as RequestInit).body as string).nickname).toBe("NewName");
  });

  it("opens Settings with the warning when redirected for a missing nickname", () => {
    renderPage("/profile", { needNickname: true });
    expect(screen.getByLabelText("Nickname *")).toBeInTheDocument();
    expect(screen.getByText(/You need to fill in a nickname first/)).toBeInTheDocument();
  });

  it("deletes a build after confirmation", async () => {
    saveBuild({
      id: "b1",
      name: "Doomed build",
      description: "",
      mechId: "m1",
      weaponId: null,
      skillIds: [],
      weaponIds: [],
      weaponSkillIds: {},
      hearts: 0,
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.queryByText("Doomed build")).not.toBeInTheDocument();
    expect(screen.getByText(/No builds yet/)).toBeInTheDocument();
  });

  it("shows the Log in prompt when logged out", () => {
    auth0State.isAuthenticated = false;
    renderPage();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "+ New build" })).not.toBeInTheDocument();
  });
});
