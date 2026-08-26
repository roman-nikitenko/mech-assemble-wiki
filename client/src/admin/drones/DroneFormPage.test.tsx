import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DroneFormPage } from "./DroneFormPage";

function renderPage() {
  // All list fetches (drones, drone-types) return empty — it's the "new" form.
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/drones/new"]}>
        <Routes>
          <Route path="/admin/drones/new" element={<DroneFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("DroneFormPage", () => {
  it("renders the core fields", () => {
    renderPage();
    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByText("Drone type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tier Standard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tier S" })).toBeInTheDocument();
    for (const label of ["Inherited Attack", "ATK", "HP", "DEF"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Level 1 bonus")).toBeInTheDocument();
    expect(screen.getByLabelText("Level 4 bonus")).toBeInTheDocument();
  });

  it("shows the preview video field only on S tier", async () => {
    renderPage();
    expect(screen.queryByText("Preview video")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tier S" }));
    expect(screen.getByText("Preview video")).toBeInTheDocument();
  });
});
