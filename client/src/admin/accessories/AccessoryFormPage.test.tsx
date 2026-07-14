import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccessoryFormPage } from "./AccessoryFormPage";
import type { MechSummary } from "../../api/types";

const sMechs: MechSummary[] = [
  {
    id: "m1",
    name: "Shadow Warrior",
    epithet: null,
    type: null,
    rank: "S",
    quality: null,
    imageUrl: null,
  },
];

function renderForm() {
  // Branch by URL: mechs for the dropdown, [] for everything else.
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/mechs") ? sMechs : [];
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
      <MemoryRouter initialEntries={["/admin/accessories/new"]}>
        <Routes>
          <Route path="/admin/accessories/new" element={<AccessoryFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AccessoryFormPage (create mode)", () => {
  it("Standard tier: one attribute row, no mech dropdown, no effect", async () => {
    renderForm();
    expect(await screen.findByLabelText("Attribute 1 name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Attribute 2 name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Linked S-tier mech")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Exclusive effect")).not.toBeInTheDocument();
  });

  it("S tier: two attribute rows and the mech dropdown appear", async () => {
    renderForm();
    await userEvent.selectOptions(await screen.findByLabelText("Tier"), "S");
    expect(screen.getByLabelText("Attribute 2 name")).toBeInTheDocument();
    expect(screen.getByLabelText("Linked S-tier mech")).toBeInTheDocument();
    expect(screen.queryByLabelText("Exclusive effect")).not.toBeInTheDocument();
  });

  it("picking a mech reveals the exclusive-effect textarea", async () => {
    renderForm();
    await userEvent.selectOptions(await screen.findByLabelText("Tier"), "S");
    const mechSelect = screen.getByLabelText("Linked S-tier mech");
    await userEvent.selectOptions(mechSelect, "m1");
    expect(screen.getByLabelText("Exclusive effect")).toBeInTheDocument();
  });
});
