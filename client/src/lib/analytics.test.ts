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
});
