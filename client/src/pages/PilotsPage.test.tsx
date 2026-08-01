import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PilotsPage } from "./PilotsPage";
import type { Pilot } from "../api/types";

const PILOTS: Pilot[] = [
  {
    id: "kael",
    name: "Kael",
    unlockBoost: null,
    relationshipBonus: null,
    bonusPerLevel: [],
    iconUrl: null,
    backgroundUrl: null,
    mech: null,
    weapon: null,
  },
  {
    id: "darren",
    name: "Darren",
    unlockBoost: null,
    relationshipBonus: null,
    bonusPerLevel: [],
    iconUrl: null,
    backgroundUrl: null,
    mech: null,
    weapon: null,
  },
];

function renderAt(initialEntry: string) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(PILOTS), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
  // jsdom doesn't implement scrollIntoView — stub it so the deep-link effect
  // can call it without throwing.
  Element.prototype.scrollIntoView = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PilotsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("PilotsPage deep link", () => {
  it("highlights and scrolls to the pilot named in the URL hash", async () => {
    renderAt("/pilots#pilot-darren");
    const card = await screen.findByText("Darren");
    const target = document.getElementById("pilot-darren");
    await waitFor(() => expect(target?.className).toContain("border-accent"));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    // The other pilot is not highlighted.
    expect(document.getElementById("pilot-kael")?.className).toContain("border-edge");
    expect(card).toBeInTheDocument();
  });

  it("highlights nothing without a matching hash", async () => {
    renderAt("/pilots");
    await screen.findByText("Kael");
    expect(document.getElementById("pilot-kael")?.className).toContain("border-edge");
    expect(document.getElementById("pilot-darren")?.className).toContain("border-edge");
  });
});
