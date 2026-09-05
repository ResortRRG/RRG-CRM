import multer from "multer";
import crypto from "crypto";
import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
});

// A flat list of business scripts (call scripts, talking points, etc.) —
// not tied to any other record, just a shared library everyone can pull from.
export function registerScriptFileRoutes(app) {
  app.get("/api/scripts/files", requireAuth, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, filename, mime_type, created_at, octet_length(file_data) AS size
       FROM script_files ORDER BY created_at DESC`
    );
    res.json({ files: rows });
  });

  app.post("/api/scripts/files", requireAuth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file was included in the upload" });
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO script_files (id, filename, mime_type, file_data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, req.file.originalname, req.file.mimetype, req.file.buffer, req.userId]
    );
    res.json({ id, filename: req.file.originalname, mime_type: req.file.mimetype, size: req.file.size });
  });

  app.get("/api/scripts/files/:fileId", requireAuth, async (req, res) => {
    const { rows } = await pool.query("SELECT filename, mime_type, file_data FROM script_files WHERE id = $1", [
      req.params.fileId,
    ]);
    if (!rows[0]) return res.status(404).send("File not found");
    res.set("Content-Type", rows[0].mime_type || "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(rows[0].filename)}"`);
    res.send(rows[0].file_data);
  });

  app.delete("/api/scripts/files/:fileId", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM script_files WHERE id = $1", [req.params.fileId]);
    res.json({ ok: true });
  });
}
