import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLoginPage } from "./AdminLoginPage";
import { getAdminToken } from "../auth/adminSession";

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/admin/login"]}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<p>admin home</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminLoginPage", () => {
  it("stores the token and redirects on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ token: "tok123" }), { status: 200 })
    );
    renderPage();
    await userEvent.type(screen.getByLabelText("Login"), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "pw");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("admin home")).toBeInTheDocument();
    expect(getAdminToken()).toBe("tok123");
  });

  it("shows the server's error on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Wrong login or password" }), { status: 401 })
    );
    renderPage();
    await userEvent.type(screen.getByLabelText("Login"), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "bad");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Wrong login or password")).toBeInTheDocument();
    expect(getAdminToken()).toBeNull();
  });
});
