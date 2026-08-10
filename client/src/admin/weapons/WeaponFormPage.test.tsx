import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WeaponFormPage } from "./WeaponFormPage";

function renderForm() {
  // The form loads types, pilots, mechs (owner dropdown), and weapons (edit
  // prefill). Return one mech so the owner dropdown has a selectable option;
  // everything else is satisfied by an empty array.
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const body = url.includes("/api/mechs")
      ? [{ id: "mech-1", name: "Owner Mech" }]
      : [];
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

  it("shows the Linked effect field during weapon creation", async () => {
    renderForm();
    await screen.findByRole("button", { name: "Create weapon" });
    // Always available — the server clears it when there's no owner mech.
    expect(screen.getByLabelText("Linked effect")).toBeInTheDocument();
  });

  it("adds a linked skill and submits it with its partner mech", async () => {
    const posted: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      const method = (init as RequestInit | undefined)?.method ?? "GET";
      if (url.endsWith("/api/weapons") && method === "POST") {
        posted.push(String((init as RequestInit).body));
        return Promise.resolve(
          new Response(JSON.stringify({ id: "neww" }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      const body = url.includes("/api/mechs") ? [{ id: "m9", name: "Awakening" }] : [];
      return Promise.resolve(
        new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
      );
    });
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
    await userEvent.type(await screen.findByLabelText("Name *"), "Ice Drill");
    await userEvent.click(screen.getByRole("button", { name: "+ Add linked skill" }));
    await userEvent.type(screen.getByLabelText("Linked skill 1 name"), "Pilot Bond");
    const mechSelect = screen.getByLabelText("Linked skill 1 mech");
    await within(mechSelect).findByRole("option", { name: "Awakening" });
    await userEvent.selectOptions(mechSelect, "m9");
    await userEvent.click(screen.getByRole("button", { name: "Create weapon" }));
    const body = JSON.parse(posted.at(-1)!);
    expect(body.linkedSkills).toEqual([{ name: "Pilot Bond", description: null, partnerId: "m9" }]);
  });
});
