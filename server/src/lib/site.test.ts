import { describe, expect, it } from "vitest";
import { absoluteUrl, SITE_NAME } from "./site";

describe("absoluteUrl", () => {
  it("prefixes a root-relative path with the site origin", () => {
    expect(absoluteUrl("/uploads/x.png")).toBe(
      "https://mech-assemble-wiki.online/uploads/x.png",
    );
  });

  it("adds a missing leading slash", () => {
    expect(absoluteUrl("uploads/x.png")).toBe(
      "https://mech-assemble-wiki.online/uploads/x.png",
    );
  });

  it("leaves an already-absolute URL untouched", () => {
    expect(absoluteUrl("https://cdn.example/x.png")).toBe("https://cdn.example/x.png");
  });

  it("exposes the site name", () => {
    expect(SITE_NAME).toBe("Mech Assemble Wiki");
  });
});
