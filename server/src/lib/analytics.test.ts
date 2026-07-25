import { afterEach, describe, expect, it } from "vitest";
import { getVisitorStats } from "./analytics";

describe("getVisitorStats", () => {
  afterEach(() => {
    delete process.env.GA4_PROPERTY_ID;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  it("returns null when GA4_PROPERTY_ID is not set (graceful degradation)", async () => {
    delete process.env.GA4_PROPERTY_ID;
    expect(await getVisitorStats()).toBeNull();
  });

  it("returns null (never throws) when the credentials file is unreadable", async () => {
    // Reproduces the prod crash: property configured, but the key path points
    // nowhere. Must degrade to null instead of letting google-gax crash us.
    process.env.GA4_PROPERTY_ID = "123456789";
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "/no/such/ga4-key.json";
    expect(await getVisitorStats()).toBeNull();
  });
});
