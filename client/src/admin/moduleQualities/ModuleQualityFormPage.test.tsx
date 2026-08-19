import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModuleQualityFormPage } from "./ModuleQualityFormPage";

function renderForm() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/module-qualities/new"]}>
        <Routes>
          <Route path="/admin/module-qualities/new" element={<ModuleQualityFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("ModuleQualityFormPage (create mode)", () => {
  it("enables submit once a tier and HP/ATK/DEF are filled", async () => {
    renderForm();
    const submit = await screen.findByRole("button", { name: "Create quality" });
    expect(submit).toBeDisabled();

    // Name is a tier picker now — choose Gold from the Quality tier dropdown.
    await userEvent.click(screen.getByRole("button", { name: "Quality tier" }));
    await userEvent.click(screen.getByRole("option", { name: "Gold" }));
    await userEvent.type(screen.getByLabelText("HP *"), "100");
    await userEvent.type(screen.getByLabelText("ATK *"), "10");
    await userEvent.type(screen.getByLabelText("DEF *"), "5");

    expect(submit).toBeEnabled();
  });

  it("marks an effect-count button pressed when clicked", async () => {
    renderForm();
    await screen.findByRole("button", { name: "Create quality" });
    await userEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-pressed", "true");
  });
});
