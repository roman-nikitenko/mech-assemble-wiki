import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PilotFormPage } from "./PilotFormPage";
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
  // Branch by URL: the form loads S-tier mechs (dropdown) and pilots (edit
  // prefill). Fresh Response per call — a body can only be consumed once.
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
      <MemoryRouter initialEntries={["/admin/pilots/new"]}>
        <Routes>
          <Route path="/admin/pilots/new" element={<PilotFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("PilotFormPage (create mode)", () => {
  it("disables submit until a name is typed", async () => {
    renderForm();
    const submit = await screen.findByRole("button", { name: "Create pilot" });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Name *"), "Kael");
    expect(submit).toBeEnabled();
  });

  it("offers S-tier mechs and a no-mech option in the dropdown", async () => {
    renderForm();
    const select = await screen.findByLabelText("Linked S-tier mech");
    expect(
      within(select).getByRole("option", { name: "— no mech —" })
    ).toBeInTheDocument();
    // findByRole (async) because the option appears after React Query loads the
    // S-tier mechs — findByLabelText resolves on the static label before the
    // fetch state update has re-rendered.
    expect(
      await within(select).findByRole("option", { name: "Shadow Warrior" })
    ).toBeInTheDocument();
  });
});
