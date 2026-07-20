import { Router } from "express";
import { signAdminToken, verifyPassword } from "../lib/auth";

export const adminRouter = Router();

// Deliberately NOT Auth0: one admin credential from .env (user's choice).
adminRouter.post("/login", (req, res) => {
  const b = (req.body ?? {}) as Record<string, unknown>;
  const login = typeof b.login === "string" ? b.login : "";
  const password = typeof b.password === "string" ? b.password : "";
  const okLogin = login === (process.env.ADMIN_LOGIN ?? "");
  const okPassword = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH ?? "");
  // One combined check + one message: never reveal which half failed.
  if (!okLogin || !okPassword) {
    return res.status(401).json({ error: "Wrong login or password" });
  }
  res.json({ token: signAdminToken() });
});
