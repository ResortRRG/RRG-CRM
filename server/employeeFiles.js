import multer from "multer";
import crypto from "crypto";
import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file — plenty for ID scans and signed PDFs
});

export function registerEmployeeFileRoutes(app) {
  // List files for an employee (name, type, size, upload date — not the file bytes themselves)
  app.get("/api/employees/:employeeId/files", requireAuth, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, filename, mime_type, created_at, octet_length(file_data) AS size
       FROM employee_files WHERE employee_id = $1 ORDER BY created_at DESC`,
      [req.params.employeeId]
    );
    res.json({ files: rows });
  });

  // Upload a new file for an employee
  app.post("/api/employees/:employeeId/files", requireAuth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file was included in the upload" });
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO employee_files (id, employee_id, filename, mime_type, file_data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, req.params.employeeId, req.file.originalname, req.file.mimetype, req.file.buffer, req.userId]
    );
    res.json({ id, filename: req.file.originalname, mime_type: req.file.mimetype, size: req.file.size });
  });

  // Download/view a specific file
  app.get("/api/employees/:employeeId/files/:fileId", requireAuth, async (req, res) => {
    const { rows } = await pool.query(
      "SELECT filename, mime_type, file_data FROM employee_files WHERE id = $1 AND employee_id = $2",
      [req.params.fileId, req.params.employeeId]
    );
    if (!rows[0]) return res.status(404).send("File not found");
    res.set("Content-Type", rows[0].mime_type || "application/octet-stream");
    res.set("Content-Disposition", `inline; filename="${encodeURIComponent(rows[0].filename)}"`);
    res.send(rows[0].file_data);
  });

  // Delete a file
  app.delete("/api/employees/:employeeId/files/:fileId", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM employee_files WHERE id = $1 AND employee_id = $2", [
      req.params.fileId,
      req.params.employeeId,
    ]);
    res.json({ ok: true });
  });
}
