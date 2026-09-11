import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// This file CREATES NOTHING and DELETES NOTHING. The catalog ships pre-seeded
// by the add_aircraft_attributes migration and has no write endpoint, so there
// are no "[test:...]" fixtures to clean up — the CLAUDE.md rule about never
// touching unprefixed rows is satisfied by construction, not by a prefix filter.
// Hence an afterAll with no deleteMany.
afterAll(async () => {
  await prisma.$disconnect();
});

interface Attribute {
  id: string;
  name: string;
  sortOrder: number;
}
interface Group {
  id: string;
  name: string;
  unit: "Flat" | "Percent";
  q1Max: number;
  q8Max: number;
  q13Max: number;
  sortOrder: number;
  attributes: Attribute[];
}

async function fetchGroups(): Promise<Group[]> {
  const res = await request(app).get("/api/aircraft-attributes");
  expect(res.status).toBe(200);
  return res.body as Group[];
}

describe("GET /api/aircraft-attributes", () => {
  // Exact counts are the right assertion here precisely because the data is
  // fixed and not admin-editable: a half-applied seed should fail loudly.
  // Bump these when a later migration grows the catalog.
  it("serves the whole seeded catalog: 10 groups, 29 attributes", async () => {
    const groups = await fetchGroups();
    expect(groups).toHaveLength(10);
    expect(groups.reduce((n, g) => n + g.attributes.length, 0)).toBe(29);
  });

  it("groups the element attributes under their caps", async () => {
    const groups = await fetchGroups();
    // Look rows up by name, never by array index.
    const element = groups.find((g) => g.name === "Element DMG");
    expect(element).toBeDefined();
    expect(element!.q13Max).toBe(100);
    expect(element!.attributes.map((a) => a.name)).toContain("Thunder DMG");
    expect(element!.attributes).toHaveLength(6);
  });

  // The assertion that justifies the Float column: a fractional cap must come
  // back as a JSON number, not the "2.5" string a Decimal column would give.
  it("returns fractional caps as numbers", async () => {
    const groups = await fetchGroups();
    const halved = groups.find((g) => g.name === "Source type (halved)");
    expect(halved).toBeDefined();
    expect(halved!.q1Max).toBe(2.5);
    expect(typeof halved!.q1Max).toBe("number");
    expect(halved!.q8Max).toBe(40);
    expect(halved!.q13Max).toBe(50);
  });

  it("marks only the flat groups as Flat", async () => {
    const groups = await fetchGroups();
    expect(groups.find((g) => g.name === "Flat HP")!.unit).toBe("Flat");
    expect(groups.find((g) => g.name === "Flat ATK / DEF")!.unit).toBe("Flat");
    expect(groups.find((g) => g.name === "PvP final")!.unit).toBe("Percent");
  });

  it("orders groups and their attributes by sortOrder", async () => {
    const groups = await fetchGroups();
    const orders = groups.map((g) => g.sortOrder);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    expect(groups[0].name).toBe("Flat HP");

    for (const g of groups) {
      const inner = g.attributes.map((a) => a.sortOrder);
      expect([...inner].sort((a, b) => a - b)).toEqual(inner);
    }
  });
});
