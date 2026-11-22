import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminEventsPage } from "./AdminEventsPage";
import { EventFormPage } from "./EventFormPage";
import type { CalendarEvent, EventAsset } from "../../api/types";

const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: "e1", gameId: 1021, name: "Gacha", category: "draw", startDate: "2026-11-01", endDate: "2026-11-07",
  minServerDay: 28, featuring: null, iconUrl: null, backgroundUrl: null, otherBackgrounds: [], rewards: [], ...over,
});
const EVENTS = [ev({}), ev({ id: "e2", gameId: 5032, name: "Air War Simulation", category: "rank" })];

type Call = { url: string; method: string; body: unknown };
/** Routes fetch by URL, records every call. `assets` is what the registry returns. */
function mockApi(calls: Call[], assets: EventAsset[] = []) {
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const isForm = init?.body instanceof FormData;
    calls.push({ url, method, body: init?.body && !isForm ? JSON.parse(String(init.body)) : undefined });
    let body: unknown = {};
    if (method === "GET" && url.includes("/api/event-assets")) body = assets;
    else if (method === "GET") body = EVENTS;
    else if (url.endsWith("/api/uploads")) body = { url: "/uploads/new-diamond.webp" };
    else if (url.endsWith("/api/events/import")) body = { created: 1, updated: 0 };
    else if (url.endsWith("/api/event-assets/bulk")) body = { saved: 1 };
    else body = { id: "new" };
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
  });
}

function renderApp(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/events/new" element={<EventFormPage />} />
          <Route path="/admin/events/:id/edit" element={<EventFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

const gameFile = (over: object = {}) =>
  new File(
    [JSON.stringify({ events: [{
      id: 777, name: "New Draw", category: "draw", start: "2026-12-01", end: "2026-12-07",
      icon: null, background: null, other_backgrounds: [],
      rewards: [{ section: "Pool", note: null, items: [{ name: "Diamond", amount: null, quality: 4, icon: "images/reward-icons/item-9-diamond.png" }] }],
      ...over,
    }] })],
    "events.json",
    { type: "application/json" },
  );

describe("AdminEventsPage", () => {
  it("lists events and filters by category", async () => {
    mockApi([]);
    renderApp("/admin/events");
    expect(await screen.findByText("Gacha")).toBeInTheDocument();
    expect(screen.getByText("Air War Simulation")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Power & Air War" }));
    expect(screen.queryByText("Gacha")).not.toBeInTheDocument();
    expect(screen.getByText("Air War Simulation")).toBeInTheDocument();
  });
});

describe("Import dialog", () => {
  async function openDialog(calls: Call[], assets: EventAsset[] = []) {
    mockApi(calls, assets);
    renderApp("/admin/events");
    await screen.findByText("Gacha");
    await userEvent.click(screen.getByRole("button", { name: "Import JSON" }));
    return screen.getByRole("dialog", { name: "Import events" });
  }

  it("shows an example of the expected JSON as a hint", async () => {
    await openDialog([]);
    expect(screen.getByText(/"final_raid"/)).toBeInTheDocument();
    expect(screen.getByText(/"other_backgrounds"/)).toBeInTheDocument();
  });

  it("previews create/update counts and lists image keys nobody has uploaded", async () => {
    await openDialog([]);
    await userEvent.upload(screen.getByLabelText("Events JSON file"), gameFile());
    expect(await screen.findByText(/Will create/)).toHaveTextContent("New Draw");
    expect(screen.getByText(/Missing images/)).toHaveTextContent("item-9-diamond");
  });

  it("previews an existing game id as an update", async () => {
    await openDialog([]);
    await userEvent.upload(screen.getByLabelText("Events JSON file"), gameFile({ id: 1021, name: "Gacha" }));
    expect(await screen.findByText(/Will update/)).toHaveTextContent("Gacha");
  });

  it("imports with a registered image resolved to its url", async () => {
    const calls: Call[] = [];
    await openDialog(calls, [{ key: "item-9-diamond", url: "/uploads/d.webp" }]);
    await userEvent.upload(screen.getByLabelText("Events JSON file"), gameFile());
    await userEvent.click(await screen.findByRole("button", { name: "Import" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/api/events/import"))).toBe(true));
    const post = calls.find((c) => c.url.endsWith("/api/events/import"))!;
    const sent = (post.body as { events: CalendarEvent[] }).events[0];
    expect(sent.gameId).toBe(777);
    expect(sent.rewards[0].items[0].iconUrl).toBe("/uploads/d.webp");
    expect(calls.some((c) => c.url.endsWith("/api/uploads"))).toBe(false); // nothing re-uploaded
  });

  it("uploads a supplied image, registers its key, then imports with the new url", async () => {
    const calls: Call[] = [];
    await openDialog(calls);
    await userEvent.upload(screen.getByLabelText("Events JSON file"), gameFile());
    // .webp on disk matches the .png path in the JSON — only the key counts.
    await userEvent.upload(screen.getByLabelText("Image files"), new File(["x"], "item-9-diamond.webp", { type: "image/webp" }));
    expect(screen.queryByText(/Missing images/)).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Import" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/api/events/import"))).toBe(true));

    const order = calls.filter((c) => c.method === "POST").map((c) => c.url.replace(/^.*\/api/, ""));
    expect(order).toEqual(["/uploads", "/event-assets/bulk", "/events/import"]);
    const bulk = calls.find((c) => c.url.endsWith("/api/event-assets/bulk"))!.body;
    expect(bulk).toEqual({ assets: [{ key: "item-9-diamond", url: "/uploads/new-diamond.webp" }] });
    const sent = (calls.find((c) => c.url.endsWith("/api/events/import"))!.body as { events: CalendarEvent[] }).events[0];
    expect(sent.rewards[0].items[0].iconUrl).toBe("/uploads/new-diamond.webp");
  });

  it("registers each image as soon as it uploads, so a failure part-way does not lose the earlier ones", async () => {
    const calls: Call[] = [];
    mockApi(calls);
    // Second upload fails (e.g. file too big); then works on the retry.
    let uploads = 0;
    const base = vi.mocked(globalThis.fetch).getMockImplementation()!;
    vi.mocked(globalThis.fetch).mockImplementation((input, init) => {
      if (String(input).endsWith("/api/uploads")) {
        uploads += 1;
        calls.push({ url: String(input), method: "POST", body: undefined });
        if (uploads === 2) return Promise.resolve(new Response(JSON.stringify({ error: "File too large" }), { status: 400 }));
        return Promise.resolve(new Response(JSON.stringify({ url: `/uploads/u${uploads}.webp` }), { status: 200 }));
      }
      return base(input, init);
    });
    renderApp("/admin/events");
    await screen.findByText("Gacha");
    await userEvent.click(screen.getByRole("button", { name: "Import JSON" }));
    const file = gameFile({
      icon: "images/event-icons/icon-a.png",
      rewards: [{ section: "S", note: null, items: [{ name: "D", amount: 1, quality: 1, icon: "images/reward-icons/item-b.png" }] }],
    });
    await userEvent.upload(screen.getByLabelText("Events JSON file"), file);
    await userEvent.upload(screen.getByLabelText("Image files"), [
      new File(["x"], "icon-a.webp", { type: "image/webp" }),
      new File(["x"], "item-b.webp", { type: "image/webp" }),
    ]);
    await userEvent.click(await screen.findByRole("button", { name: "Import" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("File too large");

    // The first image was registered BEFORE the second one failed...
    const bulks = calls.filter((c) => c.url.endsWith("/api/event-assets/bulk"));
    expect(bulks).toHaveLength(1);
    // (Which key goes first is the parser's order; what matters is that upload #1 was saved.)
    expect(bulks[0].body).toMatchObject({ assets: [{ url: "/uploads/u1.webp" }] });
    expect((bulks[0].body as { assets: unknown[] }).assets).toHaveLength(1);
    // ...and the retry uploads ONLY the one that failed.
    await userEvent.click(screen.getByRole("button", { name: "Import" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/api/events/import"))).toBe(true));
    expect(uploads).toBe(3); // 2 on the first try + 1 on the retry (not 4)
  });

  it("warns that updating overwrites hand edits", async () => {
    await openDialog([]);
    await userEvent.upload(screen.getByLabelText("Events JSON file"), gameFile({ id: 1021, name: "Gacha" }));
    expect(await screen.findByText(/hand edits/i)).toBeInTheDocument();
  });

  it("shows the parse error and keeps Import disabled for a bad file", async () => {
    await openDialog([]);
    await userEvent.upload(screen.getByLabelText("Events JSON file"), gameFile({ start: "soon" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("New Draw");
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });
});

describe("EventFormPage", () => {
  it("creates an event with the typed fields", async () => {
    const calls: Call[] = [];
    mockApi(calls);
    renderApp("/admin/events/new");
    await userEvent.type(await screen.findByLabelText("Name *"), "Hand made");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "guild");
    await userEvent.type(screen.getByLabelText("Start date *"), "2026-12-01");
    await userEvent.type(screen.getByLabelText("End date *"), "2026-12-03");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(calls.find((c) => c.method === "POST")!.body).toMatchObject({
      name: "Hand made", category: "guild", startDate: "2026-12-01", endDate: "2026-12-03", gameId: null, rewards: [],
    });
  });

  it("blocks saving when the end is before the start", async () => {
    mockApi([]);
    renderApp("/admin/events/new");
    await userEvent.type(await screen.findByLabelText("Name *"), "Backwards");
    await userEvent.type(screen.getByLabelText("Start date *"), "2026-12-05");
    await userEvent.type(screen.getByLabelText("End date *"), "2026-12-01");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
