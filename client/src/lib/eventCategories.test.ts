import { afterEach, describe, expect, it, vi } from "vitest";
import { readHiddenCategories, saveHiddenCategories } from "./eventCategories";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("hidden categories storage", () => {
  it("round-trips and ignores unknown values", () => {
    saveHiddenCategories(["draw", "shop"]);
    expect(readHiddenCategories()).toEqual(["draw", "shop"]);
    localStorage.setItem("evcal-filter", JSON.stringify(["draw", "party"]));
    expect(readHiddenCategories()).toEqual(["draw"]);
  });
  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(() => saveHiddenCategories(["draw"])).not.toThrow();
  });
});
