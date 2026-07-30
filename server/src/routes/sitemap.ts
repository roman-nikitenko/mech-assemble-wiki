import { Router } from "express";
import { prisma } from "../lib/prisma";

export const sitemapRouter = Router();

// The public origin the SITE is served from (NOT the API path). Used to build
// the absolute URLs in the sitemap. Set SITE_URL in the server env to the real
// domain; the fallback matches the CORS default in app.ts.
const SITE_URL = (process.env.SITE_URL ?? "https://mech-assemble-wiki.online").replace(
  /\/$/,
  ""
);

// Public list/landing pages that always exist (independent of the database).
// Admin and per-user pages are intentionally excluded — see robots.txt.
const STATIC_PATHS = ["/", "/weapons", "/accessories", "/pilots", "/builds"];

/** GET /api/sitemap.xml — a fresh sitemap listing every public URL: the static
    pages plus one entry per mech and per weapon (the two systems with detail
    pages). Generated from the live DB so new content is discoverable without a
    rebuild. Reference this URL from robots.txt and Google Search Console. */
sitemapRouter.get("/", async (_req, res) => {
  const [mechs, weapons] = await Promise.all([
    prisma.mech.findMany({ select: { id: true, slug: true } }),
    prisma.weapon.findMany({ select: { id: true } }),
  ]);

  const paths = [
    ...STATIC_PATHS,
    // Prefer the pretty slug; fall back to the id if a mech somehow lacks one.
    ...mechs.map((m) => `/mechs/${m.slug ?? m.id}`),
    ...weapons.map((w) => `/weapons/${w.id}`),
  ];

  const urls = paths
    .map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.header("Content-Type", "application/xml").send(xml);
});
