import { beforeEach, describe, expect, it } from "vitest";
import { deleteBuild, getBuild, listBuilds, saveBuild, type BuildRecord } from "./buildStorage";

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

describe("buildStorage", () => {
  it("lists [] when nothing is stored", () => {
    expect(listBuilds()).toEqual([]);
  });

  it("lists [] when the stored JSON is corrupt", () => {
    localStorage.setItem("mech-wiki:builds", "{not json");
    expect(listBuilds()).toEqual([]);
  });

  it("saves a build and reads it back", () => {
    saveBuild(rec());
    expect(listBuilds()).toHaveLength(1);
    expect(getBuild("b1")?.name).toBe("Test build");
    expect(getBuild("nope")).toBeUndefined();
  });

  it("replaces an existing id in place (no duplicates)", () => {
    saveBuild(rec());
    saveBuild(rec({ name: "Renamed" }));
    expect(listBuilds()).toHaveLength(1);
    expect(getBuild("b1")?.name).toBe("Renamed");
  });

  it("stamps updatedAt on save", () => {
    saveBuild(rec({ updatedAt: "2020-01-01T00:00:00.000Z" }));
    expect(getBuild("b1")!.updatedAt > "2020-01-01T00:00:00.000Z").toBe(true);
  });

  it("deletes by id", () => {
    saveBuild(rec());
    deleteBuild("b1");
    expect(listBuilds()).toEqual([]);
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
