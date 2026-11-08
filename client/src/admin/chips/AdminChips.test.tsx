import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminChipsPage } from "./AdminChipsPage";
import { ChipFormPage } from "./ChipFormPage";
import type { Chip } from "../../api/types";

const chip = (category: Chip["category"], name: string): Chip => ({
  id: category,
  name,
  category,
  createdAt: "2026-01-01T00:00:00.000Z",
  qualities: [{ quality: 5, baseStats: ["HP +1"], composeNext: 3, resetCost: null, pools: [] }],
});
const CHIPS = [chip("Head", "[Head] Chip"), chip("Legs", "[Leg] Chip")];

type Call = { url: string; method: string; body: unknown };
function mockApi(calls: Call[] = []) {
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const method = init?.method ?? "GET";
    calls.push({ url: String(input), method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const body = method === "GET" ? CHIPS : { id: "new", ...(calls.at(-1)?.body as object) };
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
  });
}

function renderApp(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/chips" element={<AdminChipsPage />} />
          <Route path="/admin/chips/new" element={<ChipFormPage />} />
          <Route path="/admin/chips/:id/edit" element={<ChipFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("AdminChipsPage", () => {
  it("filters by name and by category", async () => {
    mockApi();
    renderApp("/admin/chips");
    expect(await screen.findByText("[Head] Chip")).toBeInTheDocument();
    expect(screen.getByText("[Leg] Chip")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Search by name"), "leg");
    expect(screen.queryByText("[Head] Chip")).not.toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Search by name"));

    await userEvent.click(screen.getByRole("button", { name: "Head" }));
    expect(screen.queryByText("[Leg] Chip")).not.toBeInTheDocument();
    expect(screen.getByText("[Head] Chip")).toBeInTheDocument();
  });

  it("explains export/import in a note beside the buttons", async () => {
    mockApi();
    renderApp("/admin/chips");
    await screen.findByText("[Head] Chip");
    expect(screen.getByRole("button", { name: "Export JSON" })).toBeEnabled();
    expect(screen.getByText(/chips_data\.json/)).toBeInTheDocument();
  });

  it("previews an import and posts it on confirm", async () => {
    const calls: Call[] = [];
    mockApi(calls);
    renderApp("/admin/chips");
    await screen.findByText("[Head] Chip");
    await userEvent.click(screen.getByRole("button", { name: "Import JSON" }));

    const file = new File(
      [JSON.stringify({ format: "mech-assemble-chips", chips: [{ name: "[Head] Chip", category: "Head", qualities: [] }, { name: "[Waist] Chip", category: "Waist", qualities: [] }] })],
      "chips.json",
      { type: "application/json" },
    );
    await userEvent.upload(screen.getByLabelText("Chips JSON file"), file);
    // the matching name is announced as "replace", the new one as "create"
    const replace = (await screen.findByText("replace the data of")).closest("p");
    expect(replace).toHaveTextContent("[Head] Chip");
    expect(screen.getByText("create").closest("p")).toHaveTextContent("[Waist] Chip");
    await userEvent.click(screen.getByRole("button", { name: "Import" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/api/chips/import"))).toBe(true));
    const post = calls.find((c) => c.url.endsWith("/api/chips/import"))!;
    expect((post.body as { chips: unknown[] }).chips).toHaveLength(2);
  });

  it("rejects a bad file without enabling Import", async () => {
    mockApi();
    renderApp("/admin/chips");
    await screen.findByText("[Head] Chip");
    await userEvent.click(screen.getByRole("button", { name: "Import JSON" }));
    await userEvent.upload(screen.getByLabelText("Chips JSON file"), new File(["nope"], "x.json", { type: "application/json" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be read");
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });
});

describe("ChipFormPage", () => {
  it("suggests a name from the category, edits per quality, and posts the payload", async () => {
    const calls: Call[] = [];
    mockApi(calls);
    renderApp("/admin/chips/new");

    await userEvent.click(screen.getByRole("button", { name: "Chest" }));
    expect(screen.getByLabelText("Name *")).toHaveValue("[Chest] Chip");

    // Fill quality "Rough" (the first gem), then "Rare", each with its own values.
    await userEvent.type(screen.getByLabelText("Base stat 1"), "DEF +15");
    await userEvent.click(screen.getByRole("tab", { name: /Rare/ }));
    expect(screen.getByLabelText("Base stat 1")).toHaveValue("");
    await userEvent.type(screen.getByLabelText("Base stat 1"), "DEF +600");
    await userEvent.click(screen.getAllByRole("button", { name: "+ Add effect" })[0]);
    await userEvent.type(screen.getByLabelText("Base stat effect 1 text"), "HP +15%");
    await userEvent.selectOptions(screen.getByLabelText("Base stat effect 1 mode"), "PvE only");

    await userEvent.click(screen.getByRole("button", { name: "Save chip" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    const body = calls.find((c) => c.method === "POST")!.body as { name: string; category: string; qualities: { quality: number; baseStats: string[]; pools: { effects: { mode: string }[] }[] }[] };
    expect(body.category).toBe("Chest");
    expect(body.qualities.map((q) => q.quality).sort()).toEqual([1, 5]);
    expect(body.qualities.find((q) => q.quality === 5)!.baseStats).toEqual(["DEF +600"]);
    expect(body.qualities.find((q) => q.quality === 5)!.pools[0].effects[0].mode).toBe("PvE only");
  });

  it("loads an existing chip for editing", async () => {
    mockApi();
    renderApp("/admin/chips/Head/edit");
    expect(await screen.findByDisplayValue("[Head] Chip")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Rare/ }));
    expect(screen.getByLabelText("Base stat 1")).toHaveValue("HP +1");
  });
});
