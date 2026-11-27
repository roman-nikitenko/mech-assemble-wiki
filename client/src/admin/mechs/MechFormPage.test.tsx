import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MechFormPage } from "./MechFormPage";

function renderForm(initialEntry: string | { pathname: string; state?: unknown } = "/admin/mechs/new") {
  // The form still fetches pilots and types on mount — an empty array
  // satisfies both. Fresh Response per call: a body can only be consumed once.
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
      <MemoryRouter initialEntries={[initialEntry]}>
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

  it("adds and removes trait text rows", async () => {
    renderForm();
    await screen.findByRole("button", { name: "Create mech" });
    // Starts with no rows; + adds an empty text field.
    expect(screen.queryByLabelText("Trait 1")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "+ Add trait" }));
    const row = screen.getByLabelText("Trait 1");
    await userEvent.type(row, "Thunder");
    expect(row).toHaveValue("Thunder");
    // − removes the row again.
    await userEvent.click(screen.getByRole("button", { name: "Remove trait 1" }));
    expect(screen.queryByLabelText("Trait 1")).not.toBeInTheDocument();
  });

  it("renders 7 numbered rank-up preview slots", async () => {
    renderForm();
    await screen.findByRole("button", { name: "Create mech" });
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByLabelText(`Rank ${i} preview`)).toBeInTheDocument();
    }
    expect(screen.queryByLabelText("Rank 8 preview")).not.toBeInTheDocument();
  });

  it("adds a skin card with 5 star-bonus slots and removes it", async () => {
    renderForm();
    await screen.findByRole("button", { name: "Create mech" });
    await userEvent.click(screen.getByRole("button", { name: "+ Add skin" }));
    expect(screen.getByLabelText("Skin 1 name")).toBeInTheDocument();
    for (let j = 1; j <= 5; j++) {
      expect(screen.getByLabelText(`Skin 1 bonus ${j}`)).toBeInTheDocument();
    }
    // A blank skin name blocks submit until filled or removed.
    await userEvent.type(screen.getByLabelText("Name *"), "Iron Colossus");
    expect(screen.getByRole("button", { name: "Create mech" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Remove skin 1" }));
    expect(screen.queryByLabelText("Skin 1 name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create mech" })).toBeEnabled();
  });

  it("shows the Saved toast when arriving right after a create", async () => {
    // Creating navigates to the edit route with { justSaved } in location
    // state — this renders the landing side of that hop.
    renderForm({ pathname: "/admin/mechs/new", state: { justSaved: true } });
    await screen.findByRole("button", { name: "Create mech" });
    expect(screen.getByText("✓ Saved")).toBeInTheDocument();
  });

  it("shows both Image and Icon upload fields", async () => {
    renderForm();
    await screen.findByRole("button", { name: "Create mech" });
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByText("Icon")).toBeInTheDocument();
  });

  it("adds a linked skill and submits it with its partner weapon", async () => {
    const posted: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input);
      const method = (init as RequestInit | undefined)?.method ?? "GET";
      if (url.includes("/api/weapons")) {
        return Promise.resolve(
          new Response(JSON.stringify([{ id: "w9", name: "Ice Drill" }]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      if (url.endsWith("/api/mechs") && method === "POST") {
        posted.push(String((init as RequestInit).body));
        return Promise.resolve(
          new Response(JSON.stringify({ id: "newmech" }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
      );
    });
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
    await userEvent.type(await screen.findByLabelText("Name *"), "Awakening");
    await userEvent.click(screen.getByRole("button", { name: "+ Add linked skill" }));
    await userEvent.type(screen.getByLabelText("Linked skill 1 name"), "Frost Synergy");
    // Wait for the weapons query to populate this specific select.
    const weaponSelect = screen.getByLabelText("Linked skill 1 weapon");
    await within(weaponSelect).findByRole("option", { name: "Ice Drill" });
    await userEvent.selectOptions(weaponSelect, "w9");
    await userEvent.click(screen.getByRole("button", { name: "Create mech" }));
    const body = JSON.parse(posted.at(-1)!);
    expect(body.linkedSkills).toEqual([{ name: "Frost Synergy", description: null, partnerId: "w9" }]);
  });
});

describe("MechFormPage 3D SS view", () => {
  it("offers the upload only for S mechs", async () => {
    renderForm();
    await screen.findByRole("button", { name: "Create mech" });
    await userEvent.click(screen.getByRole("button", { name: "Rank Standard" }));
    expect(screen.queryByLabelText("3D SS view")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Rank S" }));
    expect(screen.getByLabelText("3D SS view")).toBeInTheDocument();
  });

  it("sends the uploaded view for an S mech and null after switching to Standard", async () => {
    const url = "/uploads/viewers/11111111-1111-4111-8111-111111111111/index.html";
    const posted: string[] = [];
    renderForm();
    vi.mocked(globalThis.fetch).mockImplementation((input, init) => {
      const path = String(input);
      const method = (init as RequestInit | undefined)?.method ?? "GET";
      const reply = (body: unknown, status = 200) =>
        Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
      if (path.includes("/api/uploads/viewer")) return reply({ url }, 201);
      if (path.endsWith("/api/mechs") && method === "POST") {
        posted.push(String((init as RequestInit).body));
        return reply({ error: "stay on the form" }, 400);
      }
      return reply([]);
    });
    await userEvent.type(await screen.findByLabelText("Name *"), "Shadow");
    await userEvent.click(screen.getByRole("button", { name: "Rank S" }));
    await userEvent.upload(screen.getByLabelText("3D SS view"), new File(["z"], "v.zip", { type: "application/zip" }));
    await screen.findByRole("link", { name: "Open preview" });
    await userEvent.click(screen.getByRole("button", { name: "Create mech" }));
    await vi.waitFor(() => expect(posted).toHaveLength(1));
    expect(JSON.parse(posted[0]).ssViewerUrl).toBe(url);

    await userEvent.click(screen.getByRole("button", { name: "Rank Standard" }));
    await userEvent.click(screen.getByRole("button", { name: "Create mech" }));
    await vi.waitFor(() => expect(posted).toHaveLength(2));
    expect(JSON.parse(posted[1]).ssViewerUrl).toBeNull();
  });
});
