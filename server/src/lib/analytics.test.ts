import { afterEach, describe, expect, it } from "vitest";
import { getVisitorStats } from "./analytics";

describe("getVisitorStats", () => {
  afterEach(() => {
    delete process.env.GA4_PROPERTY_ID;
  });

  it("returns null when GA4_PROPERTY_ID is not set (graceful degradation)", async () => {
    delete process.env.GA4_PROPERTY_ID;
    expect(await getVisitorStats()).toBeNull();
  });
});
