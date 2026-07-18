import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";
import { saveBuild } from "../../profile/buildStorage";
import { loadProfile } from "../../profile/profileStorage";

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

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
    // Post is a placeholder until builds can go public
    expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();
  });

  it("saves nickname and server from the Settings tab", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: "Settings" }));
    // nickname is required — Save stays locked until it's filled
    expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Nickname *"), "BanzaiFun");
    await userEvent.type(screen.getByLabelText("Game server"), "EU-7");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(loadProfile()).toEqual({ nickname: "BanzaiFun", server: "EU-7" });
    expect(screen.getByText("✓ Saved")).toBeInTheDocument();
  });

  it("opens Settings with the warning when redirected for a missing nickname", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/profile", state: { needNickname: true } }]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
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
});
