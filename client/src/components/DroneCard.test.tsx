import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Drone } from "../api/types";
import { DroneCard } from "./DroneCard";

// Level-up bonus rows are pinned to the gems [0, 7, 8, 9], in order.
const drone: Drone = {
  id: "d1",
  name: "Buzz",
  iconUrl: null,
  tier: "S",
  droneTypeId: "dt1",
  inheritAttack: null,
  atk: null,
  hp: null,
  def: null,
  previewVideoUrl: null,
  levelUpBonuses: ["at gem 0", "at gem 7", "at gem 8", "at gem 9"],
};

/** The bonus row wrapping a given bonus text. */
const row = (text: string) => screen.getByText(text).closest("div")!;

describe("DroneCard preview video", () => {
  const withVideo: Drone = { ...drone, previewVideoUrl: "/uploads/buzz-preview.mp4" };

  it("renders no <video> until the preview button is clicked", async () => {
    // The whole point: six cards on a page must not each start downloading a
    // video. The element only exists once the modal opens.
    const { container } = render(<DroneCard drone={withVideo} type={undefined} />);
    expect(container.querySelector("video")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Play preview video" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector("video")).not.toBeNull();
  });

  it("plays the preview on a loop", async () => {
    render(<DroneCard drone={withVideo} type={undefined} />);
    await userEvent.click(screen.getByRole("button", { name: "Play preview video" }));
    const video = (await screen.findByRole("dialog")).querySelector("video")!;
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("autoplay");
  });

  it("drops the <video> again when the modal closes", async () => {
    const { container } = render(<DroneCard drone={withVideo} type={undefined} />);
    await userEvent.click(screen.getByRole("button", { name: "Play preview video" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
  });

  it("shows no preview button when the drone has no video", () => {
    render(<DroneCard drone={drone} type={undefined} />);
    expect(screen.queryByRole("button", { name: "Play preview video" })).not.toBeInTheDocument();
  });
});

describe("DroneCard level-up bonuses", () => {
  it("dims the bonuses the chosen quality hasn't reached", () => {
    render(<DroneCard drone={drone} type={undefined} quality={7} />);
    // Gems 0 and 7 are reached at quality 7…
    expect(row("at gem 0")).not.toHaveClass("opacity-40");
    expect(row("at gem 7")).not.toHaveClass("opacity-40");
    // …8 and 9 are not.
    expect(row("at gem 8")).toHaveClass("opacity-40");
    expect(row("at gem 9")).toHaveClass("opacity-40");
  });

  it("dims nothing when no quality is given (the browse page)", () => {
    render(<DroneCard drone={drone} type={undefined} />);
    for (const bonus of drone.levelUpBonuses) {
      expect(row(bonus)).not.toHaveClass("opacity-40");
    }
  });
});
