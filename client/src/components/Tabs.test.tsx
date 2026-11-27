import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./Tabs";

describe("Tabs with an icon", () => {
  it("shows only the icon, named after the tab, and still selects by name", async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={["Skin", "SS 3D view"]} active="Skin" onChange={onChange} icons={{ "SS 3D view": <i data-testid="ss" /> }} />);
    const tab = screen.getByRole("tab", { name: "SS 3D view" });
    expect(tab).toContainElement(screen.getByTestId("ss"));
    expect(tab).not.toHaveTextContent("SS 3D view");
    expect(screen.getByRole("tab", { name: "Skin" })).toHaveTextContent("Skin");
    await userEvent.click(tab);
    expect(onChange).toHaveBeenCalledWith("SS 3D view");
  });
});
