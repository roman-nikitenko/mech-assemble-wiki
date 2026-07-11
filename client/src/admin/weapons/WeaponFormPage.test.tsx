import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WeaponFormPage } from "./WeaponFormPage";

function renderForm() {
  // The form loads types, pilots, S-mechs, and weapons (edit prefill) —
  // an empty array satisfies all of them for these tests.
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
      <MemoryRouter initialEntries={["/admin/weapons/new"]}>
        <Routes>
          <Route path="/admin/weapons/new" element={<WeaponFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("WeaponFormPage (create mode)", () => {
  it("disables submit until a name is typed", async () => {
    renderForm();
    const submit = await screen.findByRole("button", { name: "Create weapon" });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Name *"), "Doom Cannon");
    expect(submit).toBeEnabled();
  });

  it("Add skin appends a card with a name field and 5 star-bonus inputs", async () => {
    renderForm();
    await userEvent.click(await screen.findByRole("button", { name: "+ Add skin" }));
    expect(screen.getByLabelText("Skin 1 name")).toBeInTheDocument();
    expect(screen.getByLabelText("Skin 1 bonus 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Skin 1 bonus 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove skin 1" })).toBeInTheDocument();
  });
});
