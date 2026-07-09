import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MechFormPage } from "./MechFormPage";
import type { Trait } from "../../api/types";

const traits: Trait[] = [
  { id: "t1", name: "Thunder", color: "#5aa9ff" },
  { id: "t2", name: "Spreadshots", color: "#ffb84d" },
];

function renderForm() {
  // Fresh Response per call — a body can only be consumed once.
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(traits), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/mechs/new"]}>
        <Routes>
          <Route path="/admin/mechs/new" element={<MechFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("MechFormPage (create mode)", () => {
  it("disables submit until a name is typed", async () => {
    renderForm();
    const submit = await screen.findByRole("button", { name: "Create mech" });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Name *"), "Iron Colossus");
    expect(submit).toBeEnabled();
  });

  it("renders trait checkboxes from the API and toggles them", async () => {
    renderForm();
    const thunder = await screen.findByRole("checkbox", { name: "Thunder" });
    expect(thunder).not.toBeChecked();
    await userEvent.click(thunder);
    expect(thunder).toBeChecked();
  });
});
