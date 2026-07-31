// The Express app, WITHOUT .listen(). Splitting app from listener lets
// tests import the app and make requests against it directly (Supertest)
// with no port or running server involved.
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { mechsRouter } from "./routes/mechs";
import { traitsRouter } from "./routes/traits";
import { uploadsDir, uploadsRouter } from "./routes/uploads";
import { pilotsRouter } from "./routes/pilots";
import { typesRouter } from "./routes/types";
import { weaponsRouter } from "./routes/weapons";
import { accessoriesRouter } from "./routes/accessories";
import { meRouter } from "./routes/me";
import { buildsRouter } from "./routes/builds";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { sitemapRouter } from "./routes/sitemap";
import { pageMetaRouter } from "./routes/pageMeta";
import { feedbackRouter } from "./routes/feedback";

export const app = express();

// Behind nginx, trust the first proxy hop so req.ip is the real client IP
// (used by the feedback per-IP cooldown), not 127.0.0.1.
app.set("trust proxy", 1);

// CORS: locally (no CLIENT_ORIGIN set) we allow any origin so the Vite dev
// server on :5173 can call the API on :3000. In production set CLIENT_ORIGIN
// to the site URL (e.g. https://mech-assemble-wiki.online) to lock it down.
// Behind nginx the site and API share one origin, so this is belt-and-suspenders.
const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(cors(clientOrigin ? { origin: clientOrigin } : {}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/mechs", mechsRouter);
app.use("/api/traits", traitsRouter);
app.use("/api/pilots", pilotsRouter);
app.use("/api/types", typesRouter);
app.use("/api/weapons", weaponsRouter);
app.use("/api/accessories", accessoriesRouter);
app.use("/api/me", meRouter);
app.use("/api/builds", buildsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/admin", adminRouter);
app.use("/api/uploads", uploadsRouter);
// GET /api/sitemap.xml — generated from the DB for search engines.
app.use("/api/sitemap.xml", sitemapRouter);
// Serve uploaded images as plain static files: GET /uploads/<name>.
// Uploaded filenames are immutable UUIDs (a re-upload always gets a NEW
// name — see routes/uploads.ts), so the bytes at a given URL never change.
// That lets us cache them aggressively: `immutable` tells browsers never to
// revalidate, and a 1-year max-age means repeat page views skip the network
// entirely (no more 304 round-trips per image).
app.use(
  "/uploads",
  express.static(uploadsDir, { immutable: true, maxAge: "1y" })
);

// Server-rendered <head> for detail pages so social scrapers (which don't run
// JS) get item-specific link previews. In production nginx proxies only these
// path prefixes to Node; all other routes serve the static SPA build.
app.use(pageMetaRouter);

// Fallthrough for unknown routes — keep API errors as JSON, not HTML.
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Final error handler. The FOUR parameters are how Express recognizes an
// error handler. Express 5 forwards rejected promises from async handlers
// here automatically (Express 4 needed manual try/catch + next(err)).
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err); // real cause goes to the server log...
    res.status(500).json({ error: "Internal server error" }); // ...not to the client
  }
);
