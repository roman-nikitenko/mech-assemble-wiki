import { afterAll, beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

const PREFIX = "[test:pageMeta]";
let mechId = "";
let mechSlug = "";
let weaponId = "";
let weaponSlug = "";
let publishedBuildId = "";
let draftBuildId = "";
let weaponBuildId = "";

beforeAll(async () => {
  process.env.CLIENT_INDEX_HTML = path.resolve(__dirname, "../test/fixtures/index.html");

  const mech = await prisma.mech.create({
    data: {
      name: `${PREFIX} Iron Colossus`,
      slug: `${PREFIX}-iron-colossus`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      rank: "Standard",
      imageUrl: "/uploads/test-colossus.png",
    },
  });
  mechId = mech.id;
  mechSlug = mech.slug!;

  const weapon = await prisma.weapon.create({
    data: {
      name: `${PREFIX} Blade`,
      tier: "S",
      imageUrl: "/uploads/test-blade.png",
      slug: `${PREFIX}-blade`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    },
  });
  weaponId = weapon.id;
  weaponSlug = weapon.slug!;

  const user = await prisma.user.create({
    data: {
      provider: "test",
      providerAccountId: `${PREFIX}-user`,
      name: `${PREFIX} Tester`,
      nickname: `${PREFIX}-tester`,
    },
  });
  const published = await prisma.build.create({
    data: {
      userId: user.id,
      name: `${PREFIX} Crit Build`,
      description: "Stack crit and melt.",
      mechId,
      status: "Published",
    },
  });
  publishedBuildId = published.id;
  const draft = await prisma.build.create({
    data: { userId: user.id, name: `${PREFIX} Secret`, mechId, status: "Draft" },
  });
  draftBuildId = draft.id;
  const weaponBuild = await prisma.build.create({
    data: {
      userId: user.id,
      name: `${PREFIX} Weapon Build`,
      description: "Weapon-focused.",
      weaponId,
      status: "Published",
    },
  });
  weaponBuildId = weaponBuild.id;
});

afterAll(async () => {
  // Delete only our [test:] rows, children first.
  await prisma.build.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { nickname: { startsWith: PREFIX } } });
  await prisma.weapon.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.mech.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.$disconnect();
});

describe("page meta injection", () => {
  it("injects the mech's OG tags when fetched by slug", async () => {
    const res = await request(app).get(`/mechs/${mechSlug}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Iron Colossus");
    expect(res.text).toContain('property="og:title"');
    expect(res.text).toContain(
      'content="https://mech-assemble-wiki.online/uploads/test-colossus.png"',
    );
  });

  it("301-redirects a legacy UUID mech URL to its canonical slug", async () => {
    const res = await request(app).get(`/mechs/${mechId}`);
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(`https://mech-assemble-wiki.online/mechs/${mechSlug}`);
  });

  it("returns the generic page for an unknown mech", async () => {
    const res = await request(app).get("/mechs/does-not-exist");
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('property="og:title"');
  });

  it("301-redirects a legacy UUID weapon URL to its canonical slug", async () => {
    const res = await request(app).get(`/weapons/${weaponId}`);
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(`https://mech-assemble-wiki.online/weapons/${weaponSlug}`);
  });

  it("injects a Published build's name, description and mech image", async () => {
    const res = await request(app).get(`/builds/${publishedBuildId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Crit Build");
    expect(res.text).toContain("Stack crit and melt.");
    expect(res.text).toContain("uploads/test-colossus.png");
  });

  it("returns the generic page for a Draft build", async () => {
    const res = await request(app).get(`/builds/${draftBuildId}`);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('property="og:title"');
  });

  it("returns the generic page for an unknown weapon", async () => {
    const res = await request(app).get("/weapons/does-not-exist");
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('property="og:title"');
  });

  it("injects the weapon's OG tags by slug", async () => {
    const res = await request(app).get(`/weapons/${weaponSlug}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('property="og:title"');
    expect(res.text).toContain("Blade");
  });

  it("injects a Published weapon-build's weapon image", async () => {
    const res = await request(app).get(`/builds/${weaponBuildId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Weapon Build");
    expect(res.text).toContain("uploads/test-blade.png");
  });
});
