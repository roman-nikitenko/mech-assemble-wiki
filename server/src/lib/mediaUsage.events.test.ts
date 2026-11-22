import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { clearMediaUsage, findMediaUsage } from "./mediaUsage";

const P = "[test:events-media] ";
// Only rows with our prefix are ever deleted — real events/assets are never touched.
afterAll(async () => {
  await prisma.event.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.eventAsset.deleteMany({ where: { key: { startsWith: P } } });
  await prisma.$disconnect();
});

const make = (name: string) =>
  prisma.event.create({
    data: {
      name: `${P}${name}`, category: "draw",
      startDate: new Date("2031-05-01T00:00:00Z"), endDate: new Date("2031-05-02T00:00:00Z"),
      iconUrl: "/uploads/ev-icon.webp", backgroundUrl: "/uploads/ev-bg.webp",
      otherBackgrounds: ["/uploads/ev-other.webp"],
      rewards: [{ section: "S", note: null, items: [{ name: "Gem", amount: 1, quality: 1, iconUrl: "/uploads/ev-reward.webp" }] }],
    },
  });

describe("event images in the media usage scan", () => {
  it("reports icon, background, extra backgrounds and reward icons as used", async () => {
    const ev = await make("Usage");
    const usage = await findMediaUsage();
    for (const url of ["ev-icon", "ev-bg", "ev-other", "ev-reward"]) {
      const hit = usage.get(`/uploads/${url}.webp`)?.find((u) => u.id === ev.id);
      expect(hit?.kind, url).toBe("Event");
      expect(hit?.editPath).toBe(`/admin/events/${ev.id}/edit`);
    }
  });

  it("clearing urls empties those fields (rewards included) and unregisters the asset", async () => {
    const ev = await make("Clear");
    await prisma.eventAsset.create({ data: { key: `${P}k`, url: "/uploads/ev-reward.webp" } });
    await clearMediaUsage(["/uploads/ev-reward.webp", "/uploads/ev-other.webp", "/uploads/ev-icon.webp"]);

    const after = await prisma.event.findUniqueOrThrow({ where: { id: ev.id } });
    expect(after.iconUrl).toBe(null);
    expect(after.backgroundUrl).toBe("/uploads/ev-bg.webp"); // not in the list: untouched
    expect(after.otherBackgrounds).toEqual([]);
    const items = (after.rewards as { items: { iconUrl: string | null; name: string }[] }[])[0].items;
    expect(items[0]).toMatchObject({ name: "Gem", iconUrl: null }); // item kept, only the icon cleared
    expect(await prisma.eventAsset.count({ where: { key: `${P}k` } })).toBe(0);
  });
});
