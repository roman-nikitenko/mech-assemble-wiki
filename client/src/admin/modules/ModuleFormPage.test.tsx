import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModuleFormPage } from "./ModuleFormPage";

const qualities = [
  { id: "q1", name: "Blue", iconUrl: null, hp: "10.00k", atk: "1000", def: "500", effect1Value: null, effectCount: 0, sortOrder: 0 },
  { id: "q2", name: "Gold", iconUrl: null, hp: "22.00k", atk: "4400", def: "2200", effect1Value: "+30%", effectCount: 2, sortOrder: 5 },
];

function renderForm() {
  // Branch by URL so the quality dropdown/preview gets a quality to show.
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/module-qualities") ? qualities : [];
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/modules/new"]}>
        <Routes>
          <Route path="/admin/modules/new" element={<ModuleFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("ModuleFormPage (create mode)", () => {
  it("renders the Name input", async () => {
    renderForm();
    expect(await screen.findByLabelText("Name *")).toBeInTheDocument();
  });

  it("has a per-effect target toggle inside Effect 2 (module-level, no quality needed)", async () => {
    renderForm();
    await screen.findByDisplayValue("10.00k");

    const weaponBtn = screen.getByRole("button", { name: "Effect 2 Weapon" });
    expect(weaponBtn).toHaveAttribute("aria-pressed", "true");
    const mechBtn = screen.getByRole("button", { name: "Effect 2 Mech" });
    await userEvent.click(mechBtn);
    expect(mechBtn).toHaveAttribute("aria-pressed", "true");
    expect(weaponBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("loads the tier's attributes into editable fields and switches them", async () => {
    renderForm();
    // Default tier is Blue → its stats populate the fields once the catalog loads.
    expect(await screen.findByDisplayValue("10.00k")).toBeInTheDocument();

    // Switch the quality dropdown to Gold → the fields load Gold's stats.
    await userEvent.click(screen.getByRole("button", { name: "Quality" }));
    await userEvent.click(screen.getByRole("option", { name: "Gold" }));
    expect(await screen.findByDisplayValue("22.00k")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4400")).toBeInTheDocument();
  });

  it("shows the Effect 1 field only from Red up", async () => {
    renderForm();
    // Blue (default) has no effects → no Effect 1 field.
    await screen.findByDisplayValue("10.00k");
    expect(screen.queryByLabelText("Effect 1 · Elemental DMG")).not.toBeInTheDocument();

    // Red is the first tier with Effect 1 (Turquoise shares it, just a diff %).
    await userEvent.click(screen.getByRole("button", { name: "Quality" }));
    await userEvent.click(screen.getByRole("option", { name: "Red" }));
    expect(screen.getByLabelText("Effect 1 · Elemental DMG")).toBeInTheDocument();
  });

  it("shows the Effect 2 and Effect 3 bonus editors without picking a quality, and adds a bonus row", async () => {
    renderForm();
    await screen.findByDisplayValue("10.00k");

    // Effect 2/3 bonuses are module-level now — both editors are visible at
    // the default (Blue) tier, no quality selection needed.
    expect(screen.getByText("Effect 2 · Bonuses")).toBeInTheDocument();
    expect(screen.getByText("Effect 3 · Bonuses")).toBeInTheDocument();

    // No bonus rows until the admin adds one.
    expect(screen.queryByLabelText("Effect 2 bonus 1 weapon")).not.toBeInTheDocument();

    const addButtons = screen.getAllByRole("button", { name: "+ Add bonus" });
    expect(addButtons).toHaveLength(2); // one per section (Effect 2, Effect 3)
    await userEvent.click(addButtons[0]);
    expect(screen.getByLabelText("Effect 2 bonus 1 weapon")).toBeInTheDocument();
    expect(screen.getByLabelText("Effect 2 bonus 1 text")).toBeInTheDocument();
  });

  it("keeps the Effect 2/3 bonus editors visible after switching quality tiers", async () => {
    renderForm();
    await screen.findByDisplayValue("10.00k");
    await userEvent.click(screen.getByRole("button", { name: "Quality" }));
    await userEvent.click(screen.getByRole("option", { name: "Gold" }));

    expect(screen.getByText("Effect 2 · Bonuses")).toBeInTheDocument();
    expect(screen.getByText("Effect 3 · Bonuses")).toBeInTheDocument();
  });
});
