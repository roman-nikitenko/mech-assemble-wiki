import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // All test files share ONE dev database, so files running in parallel
    // workers can see each other's rows mid-test (we hit this three times:
    // trait sort order, trait cleanup races, mech filter assertions).
    // Running files one-at-a-time eliminates the whole class — the suite is
    // ~1s, so parallelism wasn't buying anything. The "[test:<file>] " name
    // prefixes stay as defense-in-depth. The grown-up fix (a separate test
    // database) is deliberately deferred — see the Cycle D spec.
    fileParallelism: false,
  },
});
