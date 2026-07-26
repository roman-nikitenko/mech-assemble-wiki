import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WeaponsPage } from "./WeaponsPage";
import type { WeaponSummary } from "../api/types";

const weapon: WeaponSummary = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Doom Cannon",
  description: "Big boom.",
  tier: "S",
  rankUpPreview: [],
  imageUrl: null,
  iconUrl: null,
  type: null,
  mech: { id: "m1", name: "Owner Mech" },
  pilot: null,
  weaponSkins: [],
  skillNodes: [],
};

function renderPage() {
  // WeaponsPage calls useWeapons() and useTypes(); the same fetch mock answers
  // both — /api/types returns [] (empty catalog), everything else returns [weapon].
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/types") ? [] : [weapon];
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <WeaponsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("WeaponsPage", () => {
  it("links each card to its weapon detail page", async () => {
    renderPage();
    const link = await screen.findByRole("link", { name: /Doom Cannon/ });
    expect(link).toHaveAttribute("href", "/weapons/33333333-3333-4333-8333-333333333333");
  });
});
