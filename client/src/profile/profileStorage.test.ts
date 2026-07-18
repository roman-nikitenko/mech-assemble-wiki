import { beforeEach, describe, expect, it } from "vitest";
import { loadProfile, saveProfile } from "./profileStorage";

beforeEach(() => localStorage.clear());

describe("profileStorage", () => {
  it("defaults to empty fields when nothing is stored", () => {
    expect(loadProfile()).toEqual({ nickname: "", server: "" });
  });

  it("round-trips settings", () => {
    saveProfile({ nickname: "BanzaiFun", server: "EU-7" });
    expect(loadProfile()).toEqual({ nickname: "BanzaiFun", server: "EU-7" });
  });

  it("survives corrupt storage", () => {
    localStorage.setItem("mech-wiki:profile", "{nope");
    expect(loadProfile()).toEqual({ nickname: "", server: "" });
  });
});
