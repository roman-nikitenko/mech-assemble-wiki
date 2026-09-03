import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccessorySetsTab } from "./AccessorySetsTab";

const accessories = [
  { id: "a1", name: "Abyssal Gauntlet", tier: "S", attributes: [], exclusiveEffect: null, imageUrl: null, iconUrl: null, mech: null },
  { id: "a2", name: "Shadow Mask", tier: "S", attributes: [], exclusiveEffect: null, imageUrl: null, iconUrl: null, mech: null },
];

const sets = [
  {
    id: "s1", name: "Abyssal Regalia", bonus: "ATK +10%", sortOrder: 0,
    accessories: [{ id: "a1", name: "Abyssal Gauntlet", tier: "S", iconUrl: null, imageUrl: null }],
  },
];

function renderTab(existing = sets) {
  const calls: { url: string; method: string; body: unknown }[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = url.includes("/api/accessory-sets") ? existing : accessories;
    let responseBody: unknown = body;
    if (method !== "GET") {
      const sent = JSON.parse(String(init?.body ?? "null"));
      calls.push({ url, method, body: sent });
      // Echo back a realistic AccessorySet, since the component adopts the
      // server's own copy of the saved set as its new draft baseline —
      // an empty `{}` response (as before) would break that on any test
      // that actually inspects the draft after a save.
      const idMatch = url.match(/\/api\/accessory-sets\/([^/]+)$/);
      responseBody = {
        id: idMatch ? idMatch[1] : "new-id",
        name: sent.name,
        bonus: sent.bonus,
        sortOrder: sent.sortOrder ?? 0,
        accessories: (sent.accessoryIds ?? []).map((id: string) => {
          const found = accessories.find((a) => a.id === id);
          return found
            ? { id: found.id, name: found.name, tier: found.tier, iconUrl: found.iconUrl, imageUrl: found.imageUrl }
            : { id, name: id, tier: "S", iconUrl: null, imageUrl: null };
        }),
      };
    }
    return Promise.resolve(
      new Response(JSON.stringify(responseBody), {
        status: 200, headers: { "Content-Type": "application/json" },
      })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AccessorySetsTab />
    </QueryClientProvider>
  );
  return calls;
}

afterEach(() => vi.restoreAllMocks());

describe("AccessorySetsTab", () => {
  it("lists existing sets with their name, bonus and pieces", async () => {
    renderTab();
    expect(await screen.findByDisplayValue("Abyssal Regalia")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ATK +10%")).toBeInTheDocument();
    expect(screen.getByText("Abyssal Gauntlet")).toBeInTheDocument();
  });

  it("says so when there are no sets yet", async () => {
    renderTab([]);
    expect(await screen.findByText(/no accessory sets yet/i)).toBeInTheDocument();
  });

  it("adds a draft block that is not saved until Save is pressed", async () => {
    const calls = renderTab([]);
    await userEvent.click(await screen.findByRole("button", { name: /add set/i }));
    expect(screen.getByLabelText("Set name")).toBeInTheDocument();
    // Nothing written yet — a draft is local until saved.
    expect(calls).toHaveLength(0);
  });

  it("sends the name, bonus and ordered accessory ids on save", async () => {
    const calls = renderTab([]);
    await userEvent.click(await screen.findByRole("button", { name: /add set/i }));
    await userEvent.type(screen.getByLabelText("Set name"), "Abyssal Regalia");
    await userEvent.type(screen.getByLabelText("Set bonus"), "ATK +10%");
    await userEvent.click(screen.getByRole("button", { name: /save set/i }));

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toMatchObject({ name: "Abyssal Regalia", bonus: "ATK +10%" });
  });

  it("refuses to save a set with no name", async () => {
    const calls = renderTab([]);
    await userEvent.click(await screen.findByRole("button", { name: /add set/i }));
    await userEvent.click(screen.getByRole("button", { name: /save set/i }));
    expect(calls).toHaveLength(0);
    expect(screen.getByRole("alert")).toHaveTextContent(/name/i);
  });

  it("removes a piece from a set in the editor", async () => {
    renderTab();
    await screen.findByDisplayValue("Abyssal Regalia");
    await userEvent.click(
      screen.getByRole("button", { name: /remove abyssal gauntlet/i })
    );
    expect(screen.queryByText("Abyssal Gauntlet")).not.toBeInTheDocument();
  });

  it("keeps another block's unsaved edit when a different block is saved", async () => {
    const twoSets = [
      sets[0],
      { id: "s2", name: "Shadow Ensemble", bonus: "DEF +5%", sortOrder: 1, accessories: [] },
    ];
    const calls = renderTab(twoSets);

    const nameInputs = await screen.findAllByLabelText("Set name");
    expect(nameInputs).toHaveLength(2);
    expect(nameInputs[0]).toHaveValue("Abyssal Regalia");
    expect(nameInputs[1]).toHaveValue("Shadow Ensemble");

    // Edit the FIRST block's name but never save it.
    await userEvent.clear(nameInputs[0]);
    await userEvent.type(nameInputs[0], "Renamed Regalia");

    // Save the SECOND block instead.
    const saveButtons = screen.getAllByRole("button", { name: /save set/i });
    await userEvent.click(saveButtons[1]);

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].method).toBe("PUT");
    expect(calls[0].body).toMatchObject({ name: "Shadow Ensemble" });

    // The first block's unsaved edit must have survived the reseed that
    // followed the second block's save (and any invalidation refetch).
    expect(screen.getByDisplayValue("Renamed Regalia")).toBeInTheDocument();
  });

  it("keeps an unsaved draft block after a different (saved) block is saved", async () => {
    const calls = renderTab();
    await screen.findByDisplayValue("Abyssal Regalia");

    await userEvent.click(screen.getByRole("button", { name: /add set/i }));
    const nameInputs = screen.getAllByLabelText("Set name");
    await userEvent.type(nameInputs[nameInputs.length - 1], "Draft In Progress");

    // Save the already-existing block, not the fresh unsaved one.
    const saveButtons = screen.getAllByRole("button", { name: /save set/i });
    await userEvent.click(saveButtons[0]);

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].method).toBe("PUT");

    // The unsaved draft (which has no server row to be reconciled against)
    // must still be present with what was typed into it.
    expect(screen.getByDisplayValue("Draft In Progress")).toBeInTheDocument();
  });

  it("shows an error panel instead of 'no sets yet' when the GET fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/accessory-sets")) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "boom" }), { status: 500 })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify(accessories), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <AccessorySetsTab />
      </QueryClientProvider>
    );

    // Must NOT tell the admin there are no sets during an outage.
    expect(await screen.findByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByText(/no accessory sets yet/i)).not.toBeInTheDocument();
  });

  it("keeps the 'Saved.' indicator visible after creating a new set", async () => {
    renderTab([]);
    await userEvent.click(await screen.findByRole("button", { name: /add set/i }));
    await userEvent.type(screen.getByLabelText("Set name"), "Fresh Set");
    await userEvent.click(screen.getByRole("button", { name: /save set/i }));

    // The create's merge must keep the block's local draft key stable, or
    // React remounts SetBlock and this indicator never appears.
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
  });

  it("keeps edits made while a save is still in flight", async () => {
    // Hold the PUT open so we can type during it, the way a slow network lets
    // an admin keep working after pressing Save.
    let release!: (v: Response) => void;
    const pending = new Promise<Response>((r) => { release = r; });

    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(
          new Response(JSON.stringify(url.includes("/api/accessory-sets") ? sets : accessories), {
            status: 200, headers: { "Content-Type": "application/json" },
          })
        );
      }
      return pending;
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <AccessorySetsTab />
      </QueryClientProvider>
    );

    const nameField = await screen.findByDisplayValue("Abyssal Regalia");
    await userEvent.click(screen.getByRole("button", { name: /save set/i }));

    // Still typing while the request is out.
    await userEvent.type(nameField, " Prime");
    expect(nameField).toHaveValue("Abyssal Regalia Prime");

    // The server echoes back what it received — the PRE-edit name.
    release(
      new Response(JSON.stringify({ ...sets[0], name: "Abyssal Regalia" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      })
    );

    // Wait for the save to actually settle before asserting — otherwise the
    // check passes simply because the response has not been processed yet, and
    // proves nothing.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save set/i })).not.toBeDisabled()
    );

    // The later typing must survive; adopting the server echo wholesale would
    // silently revert it.
    expect(nameField).toHaveValue("Abyssal Regalia Prime");
  });
});
