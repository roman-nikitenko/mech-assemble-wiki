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

export const app = express();

// Open CORS: any origin may call us. Acceptable while the API is LOCAL-ONLY;
// once auth exists and this deploys, restrict origins here.
app.use(cors());
app.use(express.json());

app.use("/api/mechs", mechsRouter);
app.use("/api/traits", traitsRouter);
app.use("/api/pilots", pilotsRouter);
app.use("/api/types", typesRouter);
app.use("/api/weapons", weaponsRouter);
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
