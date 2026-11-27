import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../lib/auth";
import { unpackViewer, ViewerPackError } from "../lib/viewerPack";
import { uploadsDir } from "./uploads";

// POST /api/uploads/viewer — multipart form, field name "viewer": the zip of a
// 3D viewer. Returns the url of its index.html (see lib/viewerPack.ts).
export function createViewerUploadRouter({ dir = uploadsDir }: { dir?: string } = {}) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB (the first pack is ~2 MB)
  });

  router.post("/", requireAdmin, (req, res) => {
    upload.single("viewer")(req, res, async (err: unknown) => {
      if (err) {
        const message =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? "The viewer zip must be 20 MB or smaller."
            : "Upload failed.";
        return res.status(400).json({ error: message });
      }
      if (!req.file) return res.status(400).json({ error: "No viewer zip provided (field name: viewer)." });
      try {
        res.status(201).json({ url: await unpackViewer(req.file.buffer, dir) });
      } catch (e) {
        if (e instanceof ViewerPackError) return res.status(400).json({ error: e.message });
        console.error("Viewer upload failed", e);
        res.status(500).json({ error: "Could not store that viewer." });
      }
    });
  });
  return router;
}
