import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArsenalSetFormPage } from "./ArsenalSetFormPage";
import { useArsenalSets } from "../../api/client";
import type { ArsenalSet } from "../../api/types";

const existing: ArsenalSet = {
  id: "s1",
  name: "Swift Set",
  iconUrl: null,
  twoPieceBonus: "Fire Rate +100%",
  fourPieceBonus: "Each shot increases DMG by 15%.",
  sortOrder: 0,
  pieceCount: 0,
};

/** Subscribes to the same query as the form. TanStack Query hands new data to
    components on a later tick (not synchronously when a refetch resolves), so a
    test waits for THIS to show the new data before checking the form. */
function CacheProbe() {
  const { data } = useArsenalSets();
  return <div data-testid="probe">{(data ?? []).map((s) => s.sortOrder).join(",")}</div>;
}

/** Renders the form at `path`; the list endpoint returns [existing] and writes
    echo `existing` back. Returns the fetch spy (to inspect writes) and the
    query client (to simulate a background refetch). */
function renderForm(path: string) {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
    const body = (init as RequestInit | undefined)?.method ? existing : [existing];
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/final-raid/sets/new" element={<ArsenalSetFormPage />} />
          <Route path="/admin/final-raid/sets/:id/edit" element={<ArsenalSetFormPage />} />
          <Route path="/admin/final-raid" element={<p>Final Raid list</p>} />
        </Routes>
      </MemoryRouter>
      <CacheProbe />
    </QueryClientProvider>
  );
  return { fetchSpy, qc };
}

/** The JSON body of the first non-GET request. */
function sentBody(fetchSpy: ReturnType<typeof renderForm>["fetchSpy"]) {
  const call = fetchSpy.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method);
  return { url: String(call?.[0]), init: call?.[1] as RequestInit, body: JSON.parse(String((call?.[1] as RequestInit).body)) };
}

afterEach(() => vi.restoreAllMocks());

describe("ArsenalSetFormPage", () => {
  it("disables Create until a name is typed", async () => {
    renderForm("/admin/final-raid/sets/new");
    const create = screen.getByRole("button", { name: "Create set" });
    expect(create).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Name *"), "Swift Set");
    expect(create).toBeEnabled();
  });

  it("POSTs name and both bonuses, then returns to the Set arsenal tab", async () => {
    const { fetchSpy } = renderForm("/admin/final-raid/sets/new");
    await userEvent.type(screen.getByLabelText("Name *"), "Bedrock Set");
    await userEvent.type(screen.getByLabelText("2-piece bonus"), "DEF +20%");
    await userEvent.type(screen.getByLabelText("4-piece bonus"), "Shield on hit");
    await userEvent.click(screen.getByRole("button", { name: "Create set" }));

    expect(await screen.findByText("Final Raid list")).toBeInTheDocument();
    const { url, init, body } = sentBody(fetchSpy);
    expect(url).toContain("/api/arsenal-sets");
    expect(init.method).toBe("POST");
    expect(body).toMatchObject({ name: "Bedrock Set", twoPieceBonus: "DEF +20%", fourPieceBonus: "Shield on hit" });
  });

  it("prefills in edit mode and PUTs to the set's id", async () => {
    const { fetchSpy } = renderForm("/admin/final-raid/sets/s1/edit");
    await waitFor(() => expect(screen.getByLabelText("Name *")).toHaveValue("Swift Set"));
    expect(screen.getByLabelText("2-piece bonus")).toHaveValue("Fire Rate +100%");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Final Raid list");
    const { url, init } = sentBody(fetchSpy);
    expect(url).toContain("/api/arsenal-sets/s1");
    expect(init.method).toBe("PUT");
  });

  it("keeps unsaved edits when the list refetches in the background", async () => {
    const { fetchSpy, qc } = renderForm("/admin/final-raid/sets/s1/edit");
    const name = await screen.findByLabelText("Name *");
    await waitFor(() => expect(name).toHaveValue("Swift Set"));
    await userEvent.clear(name);
    await userEvent.type(name, "Renamed Set");

    // What a window-refocus refetch does: fresh list data arrives. It must
    // DIFFER from the cached data — TanStack Query's structural sharing keeps
    // the old object when a refetch is identical, and then nothing re-renders.
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ ...existing, sortOrder: 1 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    await qc.refetchQueries({ queryKey: ["arsenal-sets"] });
    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("1"));
    expect(name).toHaveValue("Renamed Set");
  });

  it("says so when the set being edited no longer exists", async () => {
    renderForm("/admin/final-raid/sets/gone/edit");
    expect(await screen.findByText("That set no longer exists.")).toBeInTheDocument();
  });
});
