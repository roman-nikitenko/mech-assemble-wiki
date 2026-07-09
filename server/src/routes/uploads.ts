import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";

// Where uploaded images live on disk — server/uploads/, next to src/.
// Resolved from THIS file's location so it works no matter which directory
// node was launched from. The folder is gitignored (binary user content
// doesn't belong in git).
export const uploadsDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// mimetype -> extension we trust. Never trust the uploaded FILENAME for
// anything (collisions, ../ path tricks) — we generate our own.
const ALLOWED = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    // fileFilter runs first and only admits ALLOWED mimetypes, so the
    // lookup can't miss — the ! makes that invariant explicit.
    filename: (_req, file, cb) => cb(null, randomUUID() + ALLOWED.get(file.mimetype)!),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error("UNSUPPORTED_TYPE"));
  },
});

export const uploadsRouter = Router();

// POST /api/uploads — multipart form, field name "image".
// Returns the public URL the client should store as the mech's imageUrl.
// Invoking multer manually (instead of as route middleware) lets us turn its
// errors into our standard JSON 400s instead of HTML error pages.
uploadsRouter.post("/", (req, res) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof Error && err.message === "UNSUPPORTED_TYPE"
          ? "Only PNG, JPEG, or WebP images are allowed."
          : err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller."
            : "Upload failed.";
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided (field name: image)." });
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});
