import { describe, expect, it } from "vitest";
import { formatDate } from "./date";

describe("formatDate", () => {
  it("renders as 'day mon year' with a lowercase month", () => {
    expect(formatDate("2026-02-24T12:00:00.000Z")).toBe("24 feb 2026");
    expect(formatDate("2026-07-01T12:00:00.000Z")).toBe("1 jul 2026");
  });
});
