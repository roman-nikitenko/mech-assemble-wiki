// The Express app, WITHOUT .listen(). Splitting app from listener lets
// tests import the app and make requests against it directly (Supertest)
// with no port or running server involved.
import express from "express";
import cors from "cors";
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

export const app = express();

// CORS: locally (no CLIENT_ORIGIN set) we allow any origin so the Vite dev
// server on :5173 can call the API on :3000. In production set CLIENT_ORIGIN
// to the site URL (e.g. https://mech-assemble-wiki.online) to lock it down.
// Behind nginx the site and API share one origin, so this is belt-and-suspenders.
const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(cors(clientOrigin ? { origin: clientOrigin } : {}));
app.use(express.json());

app.use("/api/mechs", mechsRouter);
app.use("/api/traits", traitsRouter);
app.use("/api/pilots", pilotsRouter);
app.use("/api/types", typesRouter);
app.use("/api/weapons", weaponsRouter);
app.use("/api/accessories", accessoriesRouter);
app.use("/api/me", meRouter);
app.use("/api/builds", buildsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/uploads", uploadsRouter);
// Serve uploaded images as plain static files: GET /uploads/<name>.
app.use("/uploads", express.static(uploadsDir));

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
