import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AwakeningCostTiersPage } from "./AwakeningCostTiersPage";
import type { AwakeningCostTier } from "../../api/types";

// The real current state of the ladder table: nothing has been entered yet,
// so GET /api/awakening/cost-tiers returns an empty array and the page must
// still render all six levels (padded with BLANK rows), not crash or show none.
function renderPage(initialTiers: AwakeningCostTier[] = []) {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
    const method = init?.method ?? "GET";
    if (method === "PUT") {
      return Promise.resolve(new Response(init!.body as string, {
        status: 200, headers: { "Content-Type": "application/json" },
      }));
    }
    return Promise.resolve(new Response(JSON.stringify(initialTiers), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AwakeningCostTiersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return fetchMock;
}

afterEach(() => vi.restoreAllMocks());

describe("AwakeningCostTiersPage", () => {
  it("renders six blank rows against an empty ladder", async () => {
    renderPage([]);
    // Wait for the loading state to clear, then every level 1-6 should have
    // a zeroed number field — none of them should be missing or undefined.
    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(await screen.findByLabelText(`Level ${level} outer points`)).toHaveValue(0);
      expect(screen.getByLabelText(`Level ${level} outer shards`)).toHaveValue(0);
      expect(screen.getByLabelText(`Level ${level} core major`)).toHaveValue(0);
      expect(screen.getByLabelText(`Level ${level} core shards`)).toHaveValue(0);
      expect(screen.getByLabelText(`Level ${level} account grant`)).toHaveValue("");
    }
  });

  it("clearing a number field yields 0, never NaN", async () => {
    renderPage([]);
    const input = await screen.findByLabelText("Level 1 outer points");
    await userEvent.type(input, "5");
    expect(input).toHaveValue(5);
    await userEvent.clear(input);
    expect(input).toHaveValue(0);
  });

  // Regression test for the separator-stripping bug: the account-grant field
  // used to re-derive its displayed text from the parsed acctStats array on
  // every keystroke, which ate the comma and the space the instant they were
  // typed. It now buffers raw text (`acctText`) and only parses on save.
  it("keeps commas and spaces intact while typing the account grant", async () => {
    renderPage([]);
    const input = await screen.findByLabelText("Level 1 account grant");
    await userEvent.type(input, "HP +3,000, ATK +600");
    expect(input).toHaveValue("HP +3,000, ATK +600");
  });

  it("sends all six rows on save", async () => {
    const fetchMock = renderPage([]);
    await screen.findByLabelText("Level 1 outer points");
    await userEvent.click(screen.getByRole("button", { name: /Save ladder/ }));

    const putCall = await vi.waitFor(() => {
      const call = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
      if (!call) throw new Error("no PUT call yet");
      return call;
    });
    const body = JSON.parse(putCall[1]!.body as string) as { tiers: AwakeningCostTier[] };
    expect(body.tiers).toHaveLength(6);
    expect(body.tiers.map((t) => t.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("fills all six rows from a pasted codex block", async () => {
    renderPage();
    await screen.findByLabelText("Level 1 outer points");

    // Any mech carries the whole ladder — the costs are identical for all 19.
    const codexMech = JSON.stringify({
      name: "Fire Judgement",
      lv: [1, 2, 3, 4, 5, 6].map((n) => ({
        n,
        big: { major: n, sh: 100 + n * 50 },
        nodes: [{ pts: n * 100, sh: 20 + n * 10, acct: [`HP +${n},000`] }],
      })),
    });

    await userEvent.click(screen.getByRole("button", { name: "Import JSON" }));
    await userEvent.click(screen.getByLabelText("Codex JSON"));
    await userEvent.paste(codexMech);
    await userEvent.click(screen.getByRole("button", { name: "Fill the form" }));

    expect(screen.getByLabelText("Level 1 outer points")).toHaveValue(100);
    expect(screen.getByLabelText("Level 1 outer shards")).toHaveValue(30);
    expect(screen.getByLabelText("Level 6 core major")).toHaveValue(6);
    expect(screen.getByLabelText("Level 6 core shards")).toHaveValue(400);
    // The account grant keeps its comma — it flows through the same raw-text
    // buffer that typing uses.
    expect(screen.getByLabelText("Level 1 account grant")).toHaveValue("HP +1,000");
  });

  it("reports a paste that is not a codex block and leaves the table alone", async () => {
    renderPage();
    await screen.findByLabelText("Level 1 outer points");
    await userEvent.click(screen.getByRole("button", { name: "Import JSON" }));
    await userEvent.click(screen.getByLabelText("Codex JSON"));
    await userEvent.paste('{"hello":"world"}');
    await userEvent.click(screen.getByRole("button", { name: "Fill the form" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("Level 1 outer points")).toHaveValue(0);
  });
});
