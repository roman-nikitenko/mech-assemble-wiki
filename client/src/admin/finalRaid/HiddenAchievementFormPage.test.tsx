import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HiddenAchievementFormPage } from "./HiddenAchievementFormPage";
import type { HiddenAchievement } from "../../api/types";

const existing: HiddenAchievement = {
  id: "a1",
  name: "Lone Wolf",
  description: "Clear the remaining enemies after your teammate is defeated.",
  iconUrl: null,
  tier: 3,
  rewards: [
    { type: "diamond", amount: "3000" },
    { type: "supply-coin", amount: "100" },
  ],
  sortOrder: 0,
};

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
          <Route path="/admin/final-raid/achievements/new" element={<HiddenAchievementFormPage />} />
          <Route path="/admin/final-raid/achievements/:id/edit" element={<HiddenAchievementFormPage />} />
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

describe("HiddenAchievementFormPage", () => {
  it("needs a name and a description before it can be saved", async () => {
    renderForm("/admin/final-raid/achievements/new");
    const create = screen.getByRole("button", { name: "Create achievement" });
    expect(create).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Name *"), "Lone Wolf");
    expect(create).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Description *"), "Win alone.");
    expect(create).toBeEnabled();
  });

  it("offers the four qualities, with the first chosen by default", () => {
    renderForm("/admin/final-raid/achievements/new");
    expect(screen.getByLabelText("Quality 1")).toBeChecked();
    for (const tier of [2, 3, 4]) {
      expect(screen.getByLabelText(`Quality ${tier}`)).not.toBeChecked();
    }
  });

  it("starts with one reward row and adds another on + Add reward", async () => {
    renderForm("/admin/final-raid/achievements/new");
    expect(screen.getByLabelText("Reward 1 amount")).toBeInTheDocument();
    expect(screen.queryByLabelText("Reward 2 amount")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ Add reward" }));
    expect(screen.getByLabelText("Reward 2 amount")).toBeInTheDocument();
  });

  it("removes a row, and keeps one empty row when the last is removed", async () => {
    renderForm("/admin/final-raid/achievements/new");
    await userEvent.click(screen.getByRole("button", { name: "+ Add reward" }));
    await userEvent.type(screen.getByLabelText("Reward 2 amount"), "100");

    await userEvent.click(screen.getByRole("button", { name: "Remove reward 2" }));
    expect(screen.queryByLabelText("Reward 2 amount")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove reward 1" }));
    expect(screen.getByLabelText("Reward 1 amount")).toHaveValue("");
  });

  it("POSTs each reward as an amount plus the chosen item type", async () => {
    const fetchSpy = renderForm("/admin/final-raid/achievements/new");
    await userEvent.type(screen.getByLabelText("Name *"), "Lone Wolf");
    await userEvent.type(screen.getByLabelText("Description *"), "Win alone.");
    await userEvent.type(screen.getByLabelText("Reward 1 amount"), "3000");
    // The type picker is the shared Dropdown: open it, then choose by label.
    await userEvent.click(screen.getByRole("button", { name: /Reward 1 type/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Diamond" }));
    await userEvent.click(screen.getByLabelText("Quality 4"));
    await userEvent.click(screen.getByRole("button", { name: "Create achievement" }));

    await screen.findByText("Final Raid list");
    const { url, method, body } = sentWrite(fetchSpy);
    expect(url).toContain("/api/hidden-achievements");
    expect(method).toBe("POST");
    expect(body).toEqual({
      name: "Lone Wolf",
      description: "Win alone.",
      iconUrl: null,
      tier: 4,
      rewards: [{ type: "diamond", amount: "3000" }],
    });
  });

  it("drops a row that was added but never filled in", async () => {
    const fetchSpy = renderForm("/admin/final-raid/achievements/new");
    await userEvent.type(screen.getByLabelText("Name *"), "Half Rewards");
    await userEvent.type(screen.getByLabelText("Description *"), "Do something.");
    await userEvent.type(screen.getByLabelText("Reward 1 amount"), "100");
    await userEvent.click(screen.getByRole("button", { name: "+ Add reward" }));
    await userEvent.click(screen.getByRole("button", { name: "Create achievement" }));

    await screen.findByText("Final Raid list");
    expect(sentWrite(fetchSpy).body.rewards).toEqual([{ type: null, amount: "100" }]);
  });

  it("prefills in edit mode, one row per stored reward", async () => {
    const fetchSpy = renderForm("/admin/final-raid/achievements/a1/edit");
    await waitFor(() => expect(screen.getByLabelText("Name *")).toHaveValue("Lone Wolf"));
    expect(screen.getByLabelText("Reward 1 amount")).toHaveValue("3000");
    expect(screen.getByLabelText("Reward 2 amount")).toHaveValue("100");
    expect(screen.getByRole("button", { name: /Reward 1 type/ })).toHaveTextContent("Diamond");
    expect(screen.getByLabelText("Quality 3")).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Final Raid list");
    const { url, method } = sentWrite(fetchSpy);
    expect(url).toContain("/api/hidden-achievements/a1");
    expect(method).toBe("PUT");
  });

  it("says so when the achievement being edited no longer exists", async () => {
    renderForm("/admin/final-raid/achievements/gone/edit");
    expect(await screen.findByText("That achievement no longer exists.")).toBeInTheDocument();
  });
});
