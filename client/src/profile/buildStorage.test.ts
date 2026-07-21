import { beforeEach, describe, expect, it } from "vitest";
import { clearLocalBuilds, listBuilds, type BuildRecord } from "./buildStorage";

const rec = (over: Partial<BuildRecord> = {}): BuildRecord => ({
  id: "b1",
  name: "Test build",
  description: "",
  mechId: "m1",
  weaponId: null,
  skillIds: [],
  weaponIds: [],
  weaponSkillIds: {},
  hearts: 0,
  createdAt: "2026-07-15T00:00:00.000Z",
  updatedAt: "2026-07-15T00:00:00.000Z",
  ...over,
});

beforeEach(() => localStorage.clear());

describe("buildStorage (legacy import helper)", () => {
  it("lists [] when nothing is stored", () => {
    expect(listBuilds()).toEqual([]);
  });

  it("lists [] when the stored JSON is corrupt", () => {
    localStorage.setItem("mech-wiki:builds", "{not json");
    expect(listBuilds()).toEqual([]);
  });

  it("reads stored builds back, namespaced per user", () => {
    localStorage.setItem("mech-wiki:builds:u1", JSON.stringify([rec()]));
    expect(listBuilds("u1")).toHaveLength(1);
    expect(listBuilds("u1")[0].name).toBe("Test build");
    expect(listBuilds()).toEqual([]); // anon key is separate
  });

  it("clears a user's stored builds", () => {
    localStorage.setItem("mech-wiki:builds:u1", JSON.stringify([rec()]));
    clearLocalBuilds("u1");
    expect(listBuilds("u1")).toEqual([]);
  });

  it("defaults late-arriving fields for builds saved before they existed", () => {
    const { weaponId: _wid, weaponIds: _w, weaponSkillIds: _ws, hearts: _h, ...legacy } = rec();
    localStorage.setItem("mech-wiki:builds", JSON.stringify([legacy]));
    expect(listBuilds()[0].weaponId).toBeNull();
    expect(listBuilds()[0].weaponIds).toEqual([]);
    expect(listBuilds()[0].weaponSkillIds).toEqual({});
    expect(listBuilds()[0].hearts).toBe(0);
  });
});
