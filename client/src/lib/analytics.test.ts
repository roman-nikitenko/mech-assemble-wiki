import { afterEach, describe, expect, it, vi } from "vitest";
import { initAnalytics } from "./analytics";

function gtagScripts() {
  return Array.from(
    document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  document.head.querySelectorAll("script").forEach((s) => s.remove());
  delete (window as unknown as { dataLayer?: unknown[] }).dataLayer;
});

describe("initAnalytics", () => {
  it("injects nothing when VITE_GA_MEASUREMENT_ID is empty", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    initAnalytics();
    expect(gtagScripts()).toHaveLength(0);
  });

  it("injects the gtag script when a measurement id is set", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    initAnalytics();
    const scripts = gtagScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute("src")).toContain("id=G-TEST123");
  });

  it("pushes real `arguments` objects (not plain arrays) onto the dataLayer", () => {
    // Regression guard: gtag.js SILENTLY IGNORES plain arrays on the dataLayer,
    // so the config command must be pushed as an `arguments` object or GA never
    // sends a /g/collect beacon. The old arrow-function stub pushed an array
    // and broke tracking in production.
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123");
    initAnalytics();
    const entries = (window as unknown as { dataLayer: IArguments[] }).dataLayer;
    const config = entries.find((e) => e[0] === "config");
    expect(config).toBeDefined();
    expect(Array.isArray(config)).toBe(false); // must be an arguments object
    expect(config![1]).toBe("G-TEST123");
  });
});
