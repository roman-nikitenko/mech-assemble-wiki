import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfilePage } from "./ProfilePage";
import type { BuildStatus, PostedBuild } from "../../api/types";

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

// The builds GET /mine returns this — tests mutate it to set up the list.
let myBuilds: PostedBuild[] = [];

const build = (over: Partial<PostedBuild> = {}): PostedBuild => ({
  id: "b1",
  name: "Zap rush",
  description: "",
  mechId: "m1",
  weaponId: null,
  skillIds: [],
  weaponIds: [],
  weaponSkillIds: {},
  status: "Draft" as BuildStatus,
  hearts: 0,
  createdAt: "2026-07-15T00:00:00.000Z",
  updatedAt: "2026-07-15T00:00:00.000Z",
  author: { nickname: "Tester", server: "EU-1" },
  ...over,
});

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
  myBuilds = [];
  localStorage.clear();
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    const method = (init as RequestInit | undefined)?.method ?? "GET";
    const json = (body: unknown, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });

    // PUT /api/me — echo the body back
    if (url.includes("/api/me") && method === "PUT") {
      const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>;
      return json({ id: "u1", isNew: false, ...body });
    }
    // GET /api/me
    if (url.includes("/api/me")) {
      return json({ id: "u1", nickname: "Tester", server: "EU-1", isNew: false });
    }
    // Status changes flip the stored build's status so the refetch reflects it.
    const publish = url.match(/\/api\/builds\/([^/]+)\/publish$/);
    if (publish && method === "POST") {
      const b = myBuilds.find((x) => x.id === publish[1])!;
      b.status = "Published";
      return json(b);
    }
    const unpost = url.match(/\/api\/builds\/([^/]+)\/unpost$/);
    if (unpost && method === "POST") {
      const b = myBuilds.find((x) => x.id === unpost[1])!;
      b.status = "Unposted";
      return json(b);
    }
    const del = url.match(/\/api\/builds\/([^/]+)$/);
    if (del && method === "DELETE") {
      myBuilds = myBuilds.filter((x) => x.id !== del[1]);
      return json(null, 204);
    }
    // POST /api/builds — create a Draft (used by the legacy import)
    if (url.endsWith("/api/builds") && method === "POST") {
      const body = JSON.parse((init as RequestInit).body as string) as Partial<PostedBuild>;
      return json(build({ id: `new-${myBuilds.length}`, ...body }), 201);
    }
    // GET /api/builds/mine
    if (url.includes("/api/builds/mine")) {
      return json(myBuilds);
    }
    return json([]);
  });
});

afterEach(() => vi.restoreAllMocks());

describe("ProfilePage", () => {
  it("shows the empty state and a New build link", async () => {
    renderPage();
    expect(await screen.findByText(/No builds yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New build" })).toHaveAttribute(
      "href",
      "/profile/builds/new"
    );
  });

  it("lists builds as table rows — the name links to the editor", async () => {
    myBuilds = [build({ id: "b1", name: "Zap rush" })];
    renderPage();
    expect(await screen.findByRole("table")).toBeInTheDocument();
    // both the name and the Edit button link to the same editor page
    expect(screen.getByRole("link", { name: "Zap rush" })).toHaveAttribute(
      "href",
      "/profile/builds/b1/edit"
    );
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/profile/builds/b1/edit"
    );
    // A Draft build offers a yellow Post button to publish it
    expect(screen.getByRole("button", { name: "Post" })).toBeEnabled();
  });

  it("publishes a Draft build — the Post button becomes Posted", async () => {
    myBuilds = [build({ id: "b1", name: "Zap rush", status: "Draft" })];
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Post" }));
    expect(await screen.findByRole("button", { name: "✓ Posted" })).toBeInTheDocument();
  });

  it("unposts a Published build — the Posted button becomes Post", async () => {
    myBuilds = [build({ id: "b1", name: "Zap rush", status: "Published" })];
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "✓ Posted" }));
    expect(await screen.findByRole("button", { name: "Post" })).toBeInTheDocument();
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
    myBuilds = [build({ id: "b1", name: "Doomed build" })];
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.queryByText("Doomed build")).not.toBeInTheDocument()
    );
    expect(screen.getByText(/No builds yet/)).toBeInTheDocument();
  });

  it("imports legacy localStorage builds as Drafts, then clears them", async () => {
    auth0State.user = { sub: "auth0|u1" };
    localStorage.setItem(
      "mech-wiki:builds:auth0|u1",
      JSON.stringify([
        {
          id: "old1",
          name: "Legacy build",
          description: "",
          mechId: "m1",
          weaponId: null,
          skillIds: [],
          weaponIds: [],
          weaponSkillIds: {},
          hearts: 0,
          createdAt: "2026-07-14T00:00:00.000Z",
          updatedAt: "2026-07-14T00:00:00.000Z",
        },
      ])
    );
    renderPage();
    await waitFor(() => {
      const posted = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.some(
        ([u, init]) =>
          String(u).endsWith("/api/builds") &&
          (init as RequestInit | undefined)?.method === "POST"
      );
      expect(posted).toBe(true);
    });
    // The local copy is cleared so the import never runs twice.
    await waitFor(() =>
      expect(localStorage.getItem("mech-wiki:builds:auth0|u1")).toBeNull()
    );
  });

  it("shows the Log in prompt when logged out", () => {
    auth0State.isAuthenticated = false;
    renderPage();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "+ New build" })).not.toBeInTheDocument();
  });
});
