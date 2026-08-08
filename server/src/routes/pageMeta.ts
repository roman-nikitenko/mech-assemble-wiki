import { Router, type Response } from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { UUID_RE } from "../lib/uuid";
import { injectMeta } from "../lib/htmlInject";
import { mechMeta, weaponMeta, buildMeta } from "../lib/ogMeta";
import { absoluteUrl } from "../lib/site";

export const pageMetaRouter = Router();

function loadIndexHtml(): string {
  const file =
    process.env.CLIENT_INDEX_HTML ??
    path.resolve(process.cwd(), "..", "client", "dist", "index.html");
  return readFileSync(file, "utf8");
}

function sendHtml(res: Response, html: string) {
  res.type("html").send(html);
}

const MECH_META_INCLUDE = {
  type: { select: { name: true } },
  pilot: { select: { name: true } },
  traits: { include: { trait: { select: { name: true } } } },
  weapon: { select: { name: true, description: true } },
  accessory: { select: { name: true, exclusiveEffect: true } },
} satisfies Prisma.MechInclude;

pageMetaRouter.get("/mechs/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  const byUuid = UUID_RE.test(idOrSlug);
  const mech = await prisma.mech.findUnique({
    where: byUuid ? { id: idOrSlug } : { slug: idOrSlug },
    include: MECH_META_INCLUDE,
  });
  if (mech && byUuid && mech.slug) {
    return res.redirect(301, absoluteUrl(`/mechs/${mech.slug}`));
  }
  const html = loadIndexHtml();
  if (!mech) return sendHtml(res, html);
  return sendHtml(res, injectMeta(html, mechMeta(mech)));
});

pageMetaRouter.get("/weapons/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  const byUuid = UUID_RE.test(idOrSlug);
  const weapon = await prisma.weapon.findUnique({
    where: byUuid ? { id: idOrSlug } : { slug: idOrSlug },
  });
  if (weapon && byUuid && weapon.slug) {
    return res.redirect(301, absoluteUrl(`/weapons/${weapon.slug}`));
  }
  const html = loadIndexHtml();
  if (!weapon) return sendHtml(res, html);
  return sendHtml(res, injectMeta(html, weaponMeta(weapon)));
});

pageMetaRouter.get("/builds/:id", async (req, res) => {
  const html = loadIndexHtml();
  const build = await prisma.build.findFirst({
    where: { id: req.params.id, status: "Published" },
  });
  if (!build) return sendHtml(res, html);

  let imageUrl: string | null = null;
  if (build.mechId) {
    const m = await prisma.mech.findUnique({
      where: { id: build.mechId },
      select: { imageUrl: true },
    });
    imageUrl = m?.imageUrl ?? null;
  } else if (build.weaponId) {
    const w = await prisma.weapon.findUnique({
      where: { id: build.weaponId },
      select: { imageUrl: true },
    });
    imageUrl = w?.imageUrl ?? null;
  }
  const image = imageUrl ? absoluteUrl(imageUrl) : null;
  return sendHtml(res, injectMeta(html, buildMeta(build, image)));
});
