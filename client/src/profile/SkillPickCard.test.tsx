import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SkillNodeRow } from "../api/types";
import { SkillPickCard } from "./SkillPickCard";

const skill = (over: Partial<SkillNodeRow> = {}): SkillNodeRow => ({
  id: "s1",
  parentId: null,
  name: "Zap",
  description: "Fires a bolt",
  appearanceLevel: 3,
  type: "Normal",
  sortOrder: 0,
  repeatable: false,
  linkedWeaponId: null,
  linkedMechId: null,
  initialAtTier: null,
  ...over,
});

describe("SkillPickCard", () => {
  it("shows name, description and level chip; clickable when available", async () => {
    const onClick = vi.fn();
    render(<SkillPickCard skill={skill()} state="available" onClick={onClick} />);
    const card = screen.getByRole("button", { name: /Zap/ });
    expect(card).toBeEnabled();
    expect(card).toHaveTextContent("Fires a bolt");
    expect(card).toHaveTextContent("Lv: 3");
    await userEvent.click(card);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("locked cards are disabled and show the reason", () => {
    render(<SkillPickCard skill={skill()} state="locked" lockReason="Unlocks after 3 picks" />);
    const card = screen.getByRole("button", { name: /Zap/ });
    expect(card).toBeDisabled();
    expect(card).toHaveTextContent("Unlocks after 3 picks");
  });

  it("shows the mech's card art in the image space when provided", () => {
    const { container, rerender } = render(
      <SkillPickCard skill={skill()} state="available" imageUrl="/uploads/colossus-card.png" />
    );
    expect(container.querySelector("img")?.src).toContain("/uploads/colossus-card.png");
    // without art the space stays reserved but empty
    rerender(<SkillPickCard skill={skill()} state="available" imageUrl={null} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("picked cards stay clickable (second click un-picks); Core skills show the fallback name", async () => {
    const onClick = vi.fn();
    render(
      <SkillPickCard skill={skill({ name: null, type: "Core" })} state="picked" onClick={onClick} />
    );
    const card = screen.getByRole("button", { name: /Core skill/ });
    expect(card).toBeEnabled();
    expect(card).toHaveTextContent("✓");
    await userEvent.click(card);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows the linked badge for a linked skill and not for an ordinary one", () => {
    const { rerender } = render(<SkillPickCard skill={skill()} state="available" />);
    expect(screen.queryByLabelText("Linked skill")).not.toBeInTheDocument();
    rerender(<SkillPickCard skill={skill({ linkedWeaponId: "w1" })} state="available" />);
    expect(screen.getByLabelText("Linked skill")).toBeInTheDocument();
  });

  it("shows the gate partner's icon in the linked badge", () => {
    render(
      <SkillPickCard
        skill={skill({ linkedWeaponId: "w1" })}
        state="available"
        linkedIcons={{ w1: "/uploads/ice-drill-icon.png" }}
      />
    );
    const badge = screen.getByLabelText("Linked skill");
    const img = badge.querySelector("img");
    expect(img?.getAttribute("src")).toContain("/uploads/ice-drill-icon.png");
  });
});
