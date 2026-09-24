import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArsenalPieceFormPage } from "./ArsenalPieceFormPage";
import type { ArsenalPiece, ArsenalSet } from "../../api/types";

const sets: ArsenalSet[] = [
  { id: "s1", name: "Swift Set", iconUrl: null, twoPieceBonus: null, fourPieceBonus: null, sortOrder: 0, pieceCount: 1 },
];

const setPiece: ArsenalPiece = {
  id: "p1",
  name: "Swift Belt",
  iconUrl: null,
  slot: "Belt",
  qualityMin: 8,
  qualityMax: 13,
  setId: "s1",
  set: { id: "s1", name: "Swift Set" },
  sortOrder: 0,
};

/** Renders the form at `path`. GETs answer by URL; writes echo `setPiece`.
    `setList` lets a test simulate "no sets yet". */
function renderForm(path: string, setList: ArsenalSet[] = sets, cachedPieces?: ArsenalPiece[]) {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    let body: unknown;
    if ((init as RequestInit | undefined)?.method) body = setPiece;
    else if (String(input).includes("/api/arsenal-sets")) body = setList;
    else body = [setPiece];
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Simulates arriving from the list page with an older copy already cached.
  if (cachedPieces) qc.setQueryData(["arsenal-pieces"], cachedPieces);
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/final-raid/arsenal/new" element={<ArsenalPieceFormPage />} />
          <Route path="/admin/final-raid/arsenal/:id/edit" element={<ArsenalPieceFormPage />} />
          <Route path="/admin/final-raid" element={<p>Final Raid list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return fetchSpy;
}

/** The first write request, with its parsed JSON body. */
function sentWrite(fetchSpy: ReturnType<typeof renderForm>) {
  const call = fetchSpy.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method);
  const init = call?.[1] as RequestInit;
  return { url: String(call?.[0]), method: init.method, body: JSON.parse(String(init.body)) };
}

afterEach(() => vi.restoreAllMocks());

describe("ArsenalPieceFormPage", () => {
  it("hides the Set dropdown for normal arsenal and shows it for set arsenal", async () => {
    renderForm("/admin/final-raid/arsenal/new");
    expect(screen.getByLabelText("Normal arsenal")).toBeChecked();
    expect(screen.queryByLabelText("Set *")).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Set arsenal"));
    const setSelect = await screen.findByLabelText("Set *");
    expect(setSelect).toHaveTextContent("Swift Set");
  });

  it("explains why Create is disabled, step by step", async () => {
    renderForm("/admin/final-raid/arsenal/new");
    const create = screen.getByRole("button", { name: "Create piece" });
    expect(create).toBeDisabled();
    expect(screen.getByText("Enter a name.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Name *"), "Swift Belt");
    expect(screen.getByText("Choose a slot.")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Slot *"), "Belt");
    await userEvent.click(screen.getByLabelText("Set arsenal"));
    expect(screen.getByText("Choose the set this piece belongs to.")).toBeInTheDocument();
    expect(create).toBeDisabled();

    await userEvent.selectOptions(await screen.findByLabelText("Set *"), "s1");
    expect(create).toBeEnabled();
  });

  it("blocks a lowest quality above the highest", async () => {
    renderForm("/admin/final-raid/arsenal/new");
    await userEvent.type(screen.getByLabelText("Name *"), "Odd Boots");
    await userEvent.selectOptions(screen.getByLabelText("Slot *"), "Boots");
    await userEvent.selectOptions(screen.getByLabelText("Lowest quality"), "9");
    await userEvent.selectOptions(screen.getByLabelText("Highest quality"), "8");
    expect(screen.getByText("The lowest quality can't be above the highest.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create piece" })).toBeDisabled();
  });

  it("POSTs a set piece with its setId, then returns to the list", async () => {
    const fetchSpy = renderForm("/admin/final-raid/arsenal/new");
    await userEvent.type(screen.getByLabelText("Name *"), "Swift Belt");
    await userEvent.selectOptions(screen.getByLabelText("Slot *"), "Belt");
    await userEvent.selectOptions(screen.getByLabelText("Lowest quality"), "8");
    await userEvent.click(screen.getByLabelText("Set arsenal"));
    await userEvent.selectOptions(await screen.findByLabelText("Set *"), "s1");
    await userEvent.click(screen.getByRole("button", { name: "Create piece" }));

    await screen.findByText("Final Raid list");
    const { url, method, body } = sentWrite(fetchSpy);
    expect(url).toContain("/api/arsenal-pieces");
    expect(method).toBe("POST");
    expect(body).toEqual({
      name: "Swift Belt",
      iconUrl: null,
      slot: "Belt",
      qualityMin: 8,
      qualityMax: 13,
      setId: "s1",
    });
  });

  it("sends setId null after switching an existing set piece back to Normal", async () => {
    const fetchSpy = renderForm("/admin/final-raid/arsenal/p1/edit");
    await waitFor(() => expect(screen.getByLabelText("Name *")).toHaveValue("Swift Belt"));
    // Prefilled as a set piece.
    expect(screen.getByLabelText("Set arsenal")).toBeChecked();
    expect(await screen.findByLabelText("Set *")).toHaveValue("s1");

    await userEvent.click(screen.getByLabelText("Normal arsenal"));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await screen.findByText("Final Raid list");
    const { url, method, body } = sentWrite(fetchSpy);
    expect(url).toContain("/api/arsenal-pieces/p1");
    expect(method).toBe("PUT");
    expect(body.setId).toBeNull();
  });

  it("fills the form from the fresh server copy, not a stale cache", async () => {
    // The cache still has the old name; the server (fetch mock) has "Swift Belt".
    renderForm("/admin/final-raid/arsenal/p1/edit", sets, [{ ...setPiece, name: "Old Name" }]);
    await waitFor(() => expect(screen.getByLabelText("Name *")).toHaveValue("Swift Belt"));
  });

  it("points to the Set arsenal tab when no sets exist yet", async () => {
    renderForm("/admin/final-raid/arsenal/new", []);
    await userEvent.click(screen.getByLabelText("Set arsenal"));
    expect(await screen.findByRole("link", { name: "create one" })).toHaveAttribute(
      "href",
      "/admin/final-raid/sets/new"
    );
  });
});
