import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { UUID_RE } from "../lib/uuid";

export const feedbackRouter = Router();

const MAX_NAME = 80;
const MAX_MESSAGE = 2000;

// Per-IP cooldown window. Read per request (not a module const) so tests can
// shrink it via FEEDBACK_COOLDOWN_MS before hitting the route.
function cooldownMs(): number {
  return Number(process.env.FEEDBACK_COOLDOWN_MS ?? 45_000);
}

// IP -> last accepted submission time (ms). Best-effort, in-process: it resets
// on restart and is per-instance. Fine for a single-instance deploy; a
// multi-instance setup would need shared storage (e.g. Redis).
const lastSubmitByIp = new Map<string, number>();

function parseFeedback(
  body: unknown,
): { ok: true; name: string; message: string } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (name === "") return { ok: false, message: "Please enter your name." };
  if (message === "") return { ok: false, message: "Please enter a message." };
  if (name.length > MAX_NAME) {
    return { ok: false, message: `Name must be ${MAX_NAME} characters or fewer.` };
  }
  if (message.length > MAX_MESSAGE) {
    return { ok: false, message: `Message must be ${MAX_MESSAGE} characters or fewer.` };
  }
  return { ok: true, name, message };
}

// POST /api/feedback — public. Order: honeypot, then validation, then per-IP
// cooldown, then insert.
feedbackRouter.post("/", async (req, res) => {
  const b = (req.body ?? {}) as Record<string, unknown>;

  // Honeypot: `website` is a hidden field real users leave empty. If a bot
  // filled it, pretend success but store nothing (don't reveal the trap).
  if (typeof b.website === "string" && b.website.trim() !== "") {
    return res.json({ ok: true });
  }

  const parsed = parseFeedback(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.message });

  // CAPTCHA hook: if a CAPTCHA is ever enabled, verify its token here (before
  // the cooldown/insert) and 400 on failure.

  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const last = lastSubmitByIp.get(ip);
  if (last !== undefined && now - last < cooldownMs()) {
    return res.status(429).json({ error: "Too fast, slow down :)" });
  }
  lastSubmitByIp.set(ip, now);

  await prisma.feedback.create({ data: { name: parsed.name, message: parsed.message } });
  return res.status(201).json({ ok: true });
});

// GET /api/feedback — admin: all messages, newest first.
feedbackRouter.get("/", requireAdmin, async (_req, res) => {
  const items = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" } });
  res.json(items);
});

// GET /api/feedback/unread-count — admin: number of unread messages (bell).
feedbackRouter.get("/unread-count", requireAdmin, async (_req, res) => {
  const count = await prisma.feedback.count({ where: { read: false } });
  res.json({ count });
});

// POST /api/feedback/mark-read — admin: mark every unread message read.
// Idempotent; called when the admin opens the Messages page.
feedbackRouter.post("/mark-read", requireAdmin, async (_req, res) => {
  await prisma.feedback.updateMany({ where: { read: false }, data: { read: true } });
  res.json({ ok: true });
});

// DELETE /api/feedback/:id — admin: remove one message.
feedbackRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: "Message not found" });
  try {
    await prisma.feedback.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Message not found" });
    }
    throw err;
  }
});
