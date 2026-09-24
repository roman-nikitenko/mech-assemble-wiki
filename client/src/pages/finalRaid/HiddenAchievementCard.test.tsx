import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HiddenAchievementCard } from "./HiddenAchievementCard";
import type { HiddenAchievement } from "../../api/types";

const base: HiddenAchievement = {
  id: "a1",
  name: "Lone Wolf",
  description: "Clear the remaining enemies after your teammate is defeated.",
  iconUrl: "/uploads/wolf.png",
  tier: 2,
  rewards: [{ type: "diamond", amount: "3000" }],
  sortOrder: 0,
};

/** Every <img> in the card, with its src and alt. Reward icons live inside the
    <ul>, so `plateImages()` looks only at the art column + text block. */
function images(): { src: string; alt: string }[] {
  return [...document.querySelectorAll("img")].map((img) => ({ src: img.src, alt: img.alt }));
}

function plateImages(): { src: string; alt: string }[] {
  return [...document.querySelectorAll("img")]
    .filter((img) => img.closest("ul") === null)
    .map((img) => ({ src: img.src, alt: img.alt }));
}

describe("HiddenAchievementCard", () => {
  it("draws the quality plate and the achievement icon, both decorative", () => {
    render(<HiddenAchievementCard achievement={base} />);
    const imgs = plateImages(); // the quality plate and the achievement icon
    expect(imgs).toHaveLength(2);
    // Decorative: the plate says nothing useful out loud, and the icon repeats
    // the name — the quality reaches screen readers as text instead.
    expect(imgs.every((i) => i.alt === "")).toBe(true);
    // Name and description are one sentence now (no heading element), so the
    // quality rides along as screen-reader text inside that line.
    expect(screen.getByText(/quality 2/)).toBeInTheDocument();
  });

  it("frames a reward icon by the achievement's quality — gold at quality 4", () => {
    const { container, rerender } = render(<HiddenAchievementCard achievement={base} />);
    const frame = () => (container.querySelector("ul span[style]") as HTMLElement).style.backgroundImage;
    // Read the VALUE now: React updates the same node in place on rerender, so
    // holding on to the element would just re-read the new style.
    const purple = frame();
    expect(purple).not.toBe("");

    rerender(<HiddenAchievementCard achievement={{ ...base, tier: 4 }} />);
    expect(frame()).not.toBe(purple);
  });

  it("shows the name, the description and each reward as its own tile", () => {
    render(<HiddenAchievementCard achievement={{ ...base, rewards: [{ type: "diamond", amount: "3000" }, { type: null, amount: "Ticket x2" }] }} />);
    expect(screen.getByText("Lone Wolf")).toBeInTheDocument();
    expect(screen.getByText(base.description)).toBeInTheDocument();
    const tiles = screen.getAllByRole("listitem");
    expect(tiles).toHaveLength(2);
    // A known item shows its icon with the amount on it (the item name rides
    // along as screen-reader text); an unknown one falls back to plain text.
    expect(tiles[0].querySelector("img")).not.toBeNull();
    expect(tiles[0]).toHaveTextContent("Diamond 3000");
    expect(tiles[1].querySelector("img")).toBeNull();
    expect(tiles[1]).toHaveTextContent("Ticket x2");
  });

  it("leaves out the icon when there is none, and the reward line when empty", () => {
    render(<HiddenAchievementCard achievement={{ ...base, iconUrl: null, rewards: [] }} />);
    expect(images()).toHaveLength(1); // the plate only
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("still renders when the tier has no art", () => {
    render(<HiddenAchievementCard achievement={{ ...base, tier: 9, iconUrl: null, rewards: [] }} />);
    expect(images()).toHaveLength(0);
    expect(screen.getByText("Lone Wolf")).toBeInTheDocument();
  });
});
