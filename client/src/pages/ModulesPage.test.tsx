import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModulesPage } from "./ModulesPage";

const qualities = [
  { id: "qBlue", name: "Blue", iconUrl: null, hp: "10.00k", atk: "1000", def: "500", effect1Value: null, effectCount: 0, sortOrder: 0 },
  { id: "qGold", name: "Gold", iconUrl: null, hp: "22.00k", atk: "4400", def: "2200", effect1Value: "+30%", effectCount: 2, sortOrder: 5 },
  { id: "qMythic", name: "Mythic", iconUrl: null, hp: "54.00k", atk: "10.80k", def: "5400", effect1Value: "+50%", effectCount: 3, sortOrder: 6 },
];
const types = [{ id: "t1", name: "Ice", iconUrl: null }];
const modules = [
  { id: "m1", name: "Ammo Chain", iconUrl: null, effect2Target: "Weapon", effect3Target: "Weapon", effects: [] },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/module-qualities")
      ? qualities
      : url.includes("/api/modules")
        ? modules
        : url.includes("/api/types")
          ? types
          : [];
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ModulesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("ModulesPage", () => {
  it("renders a card per module and switches quality for all cards", async () => {
    renderPage();
    expect(await screen.findByText("Ammo Chain")).toBeInTheDocument();
    // Default tier Mythic → Mythic attributes shown.
    expect(await screen.findByText("54.00k")).toBeInTheDocument();

    // Switch to Gold → Gold attributes.
    await userEvent.click(screen.getByRole("button", { name: "Quality" }));
    await userEvent.click(screen.getByRole("option", { name: "Gold" }));
    expect(await screen.findByText("22.00k")).toBeInTheDocument();
  });
});
