import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AircraftFormPage } from "./AircraftFormPage";
import { useAircraft } from "../../api/client";
import type { Aircraft } from "../../api/types";

/** Subscribes to the same query as the form, so a test can wait for fresh
    cache data to actually reach React before asserting on the form. */
function CacheProbe() {
  const { data } = useAircraft();
  return <div data-testid="probe">{(data ?? []).map((a) => a.name).join(",")}</div>;
}

const existing: Aircraft = {
  id: "a1",
  name: "Sky Raider",
  description: "A heavy gunship.",
  imageUrl: null,
  tier: "S",
  hp: "54.00k",
  atk: null,
  def: null,
  specialBonus: "ATK +10%",
  // Ranks 2 and 4 grant nothing; the blanks must survive the round trip.
  rankUpPreview: ["Orange perk", "", "Turquoise perk", "", "Mythic perk"],
};

/** Renders the form at `path`, with the list endpoint returning `list`. */
function renderForm(path: string, list: Aircraft[] = []) {
  vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
    // Writes echo something back; reads return the list.
    const body = (init as RequestInit | undefined)?.method ? existing : list;
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
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/aircraft/new" element={<AircraftFormPage />} />
          <Route path="/admin/aircraft/:id/edit" element={<AircraftFormPage />} />
        </Routes>
      </MemoryRouter>
      <CacheProbe />
    </QueryClientProvider>
  );
  return qc;
}

afterEach(() => vi.restoreAllMocks());

describe("AircraftFormPage", () => {
  it("renders every field on the new form", () => {
    renderForm("/admin/aircraft/new");
    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tier Standard" })).toBeInTheDocument();
    expect(screen.getByLabelText("HP")).toBeInTheDocument();
    expect(screen.getByLabelText("ATK")).toBeInTheDocument();
    expect(screen.getByLabelText("DEF")).toBeInTheDocument();
    expect(screen.getByLabelText("Special bonus")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
    // Five rank slots, coloured Orange → Mythic.
    expect(screen.getByLabelText("Rank 1 preview")).toHaveAttribute("placeholder", "Orange");
    expect(screen.getByLabelText("Rank 5 preview")).toHaveAttribute("placeholder", "Mythic");
  });

  it("disables submit until a name is typed", async () => {
    renderForm("/admin/aircraft/new");
    const submit = screen.getByRole("button", { name: "Create aircraft" });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Name *"), "Storm Wing");
    expect(submit).toBeEnabled();
  });

  it("posts the typed values", async () => {
    renderForm("/admin/aircraft/new");
    await userEvent.type(screen.getByLabelText("Name *"), "Storm Wing");
    await userEvent.click(screen.getByRole("button", { name: "Tier S" }));
    await userEvent.type(screen.getByLabelText("HP"), "12.5k");
    await userEvent.type(screen.getByLabelText("Special bonus"), "ATK +10%");
    await userEvent.type(screen.getByLabelText("Rank 1 preview"), "ATK +5%");
    await userEvent.click(screen.getByRole("button", { name: "Create aircraft" }));

    const calls = vi.mocked(globalThis.fetch).mock.calls;
    const post = calls.find(([, init]) => (init as RequestInit | undefined)?.method === "POST");
    expect(post).toBeDefined();
    const sent = JSON.parse(String((post?.[1] as RequestInit).body));
    expect(sent.name).toBe("Storm Wing");
    expect(sent.tier).toBe("S");
    expect(sent.hp).toBe("12.5k");
    expect(sent.specialBonus).toBe("ATK +10%");
    // All five slots go out; the server trims the trailing blanks.
    expect(sent.rankUpPreview).toEqual(["ATK +5%", "", "", "", ""]);
  });

  it("prefills from the list in edit mode, keeping blank rank slots in place", async () => {
    renderForm("/admin/aircraft/a1/edit", [existing]);
    expect(await screen.findByDisplayValue("Sky Raider")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toHaveValue("A heavy gunship.");
    expect(screen.getByLabelText("Special bonus")).toHaveValue("ATK +10%");
    expect(screen.getByRole("button", { name: "Tier S" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Rank 1 preview")).toHaveValue("Orange perk");
    expect(screen.getByLabelText("Rank 2 preview")).toHaveValue("");
    expect(screen.getByLabelText("Rank 3 preview")).toHaveValue("Turquoise perk");
    expect(screen.getByLabelText("Rank 5 preview")).toHaveValue("Mythic perk");
  });

  it("keeps unsaved edits when the aircraft list refetches", async () => {
    const qc = renderForm("/admin/aircraft/a1/edit", [existing]);
    await screen.findByDisplayValue("Sky Raider");

    const name = screen.getByLabelText("Name *");
    await userEvent.clear(name);
    await userEvent.type(name, "Renamed in progress");

    // A refetch lands (window focus, an invalidation) while the admin types.
    // The row must actually differ — React Query's structural sharing hands
    // back the old reference when the new data is deeply equal, which wouldn't
    // re-run the hydration effect at all.
    qc.setQueryData(["aircraft"], [{ ...existing, name: "Server Renamed" }]);
    // Wait until the fresh data has reached React (the probe shares the query),
    // so this asserts the form survived the update rather than out-racing it.
    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("Server Renamed"));

    expect(name).toHaveValue("Renamed in progress");
  });

  it("shows the server's error message", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) =>
      Promise.resolve(
        (init as RequestInit | undefined)?.method
          ? new Response(JSON.stringify({ error: "Aircraft 'Dup' already exists." }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            })
          : new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
      )
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/admin/aircraft/new"]}>
          <Routes>
            <Route path="/admin/aircraft/new" element={<AircraftFormPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await userEvent.type(screen.getByLabelText("Name *"), "Dup");
    await userEvent.click(screen.getByRole("button", { name: "Create aircraft" }));
    expect(await screen.findByText("Aircraft 'Dup' already exists.")).toBeInTheDocument();
  });
});
