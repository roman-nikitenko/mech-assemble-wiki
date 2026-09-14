import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { AwakeningLevel } from "../api/types";
import { AwakeningEffectBox } from "./AwakeningEffectBox";

const level = (n: number, over: Partial<AwakeningLevel> = {}): AwakeningLevel => ({
  id: `lv${n}`, level: n, isLive: true, coreAttr: [], coreSkill: null, coreInfo: null,
  coreCd: [], corePower: null, coreLuckyId: null, coreReward: null, coreSkin: null, nodes: [],
  ...over,
});

describe("AwakeningEffectBox", () => {
  it("says so when no core has been reached yet", () => {
    render(<AwakeningEffectBox cores={[]} mechIconUrl={null} />);
    const box = screen.getByRole("region", { name: "Awakening Effect" });
    expect(within(box).getByText("No awakening effects yet.")).toBeInTheDocument();
  });

  it("sums the stats and lists every special effect reached", () => {
    render(
      <AwakeningEffectBox
        mechIconUrl={null}
        cores={[
          level(1, { coreAttr: ["HP +5%", "ATK +5%", "DEF +5%"], coreSkill: "DMG from Mechs -50%" }),
          level(2, {
            coreAttr: ["HP +5%", "ATK +5%", "DEF +5%"],
            coreSkill: "Use the active skill [Fatal Blade]",
            coreInfo: "Fire poison blades",
          }),
        ]}
      />
    );
    const box = screen.getByRole("region", { name: "Awakening Effect" });
    // HP, ATK and DEF each add up to +10%.
    expect(within(box).getAllByText("+10%")).toHaveLength(3);
    expect(within(box).getByText("DMG from Mechs -50%")).toBeInTheDocument();
    expect(within(box).getByText("Use the active skill [Fatal Blade]")).toBeInTheDocument();
    expect(within(box).getByText("Fire poison blades")).toBeInTheDocument();
    expect(within(box).queryByText("No awakening effects yet.")).not.toBeInTheDocument();
  });

  it("names a stat that has no sprite instead of showing a bare number", () => {
    render(<AwakeningEffectBox mechIconUrl={null} cores={[level(1, { coreAttr: ["Crit +3%"] })]} />);
    expect(screen.getByText("Crit +3%")).toBeInTheDocument();
  });
});
