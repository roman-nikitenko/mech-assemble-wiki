// The Express app, WITHOUT .listen(). Splitting app from listener lets
// tests import the app and make requests against it directly (Supertest)
// with no port or running server involved.
import express from "express";
import cors from "cors";
import { mechsRouter } from "./routes/mechs";

export const app = express();

// Open CORS: any origin may call us. Fine for a public read-only API;
// an API with auth or writes would restrict origins here.
app.use(cors());
app.use(express.json());

app.use("/api/mechs", mechsRouter);

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
