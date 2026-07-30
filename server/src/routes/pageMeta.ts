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

// Where the built SPA index.html lives. Prod sets CLIENT_INDEX_HTML in .env
// (see docs/social-link-previews.md); the fallback assumes the sibling client
// build. Read PER REQUEST — cheap at this traffic and means a client redeploy
// needs no API restart. In tests CLIENT_INDEX_HTML points at the fixture.
function loadIndexHtml(): string {
  const file =
    process.env.CLIENT_INDEX_HTML ??
    path.resolve(process.cwd(), "..", "client", "dist", "index.html");
  return readFileSync(file, "utf8");
}

function sendHtml(res: Response, html: string) {
  res.type("html").send(html);
}

// Only the fields mechMeta/mechSummary need.
const MECH_META_INCLUDE = {
  type: { select: { name: true } },
  pilot: { select: { name: true } },
  traits: { include: { trait: { select: { name: true } } } },
  weapon: { select: { name: true, description: true } },
  accessory: { select: { name: true, exclusiveEffect: true } },
} satisfies Prisma.MechInclude;

// GET /mechs/:idOrSlug — HTML with this mech's OG tags (falls back to the
// generic page when the slug/uuid resolves to nothing).
pageMetaRouter.get("/mechs/:idOrSlug", async (req, res) => {
  const html = loadIndexHtml();
  const { idOrSlug } = req.params;
  const where = UUID_RE.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
  const mech = await prisma.mech.findUnique({ where, include: MECH_META_INCLUDE });
  if (!mech) return sendHtml(res, html);
  return sendHtml(res, injectMeta(html, mechMeta(mech)));
});

// GET /weapons/:idOrSlug — HTML with this weapon's OG tags (falls back to the
// generic page when the slug/uuid resolves to nothing).
pageMetaRouter.get("/weapons/:idOrSlug", async (req, res) => {
  const html = loadIndexHtml();
  const { idOrSlug } = req.params;
  const where = UUID_RE.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
  const weapon = await prisma.weapon.findUnique({ where });
  if (!weapon) return sendHtml(res, html);
  return sendHtml(res, injectMeta(html, weaponMeta(weapon)));
});

// GET /builds/:id — Published builds only (mirrors GET /api/builds/:id). The
// preview image is the linked mech's OR weapon's full art.
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
