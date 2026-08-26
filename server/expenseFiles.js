import multer from "multer";
import crypto from "crypto";
import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file — plenty for receipt/invoice scans
});

// expenseKey is a client-generated string like "2026-08_Rent" (month + category),
// so receipts stay tied to the exact month and category they belong to.
export function registerExpenseFileRoutes(app) {
  // List files for an expense category/month
  app.get("/api/expenses/:expenseKey/files", requireAuth, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, filename, mime_type, created_at, octet_length(file_data) AS size
       FROM expense_files WHERE expense_key = $1 ORDER BY created_at DESC`,
      [req.params.expenseKey]
    );
    res.json({ files: rows });
  });

  // Upload a new file for an expense category/month
  app.post("/api/expenses/:expenseKey/files", requireAuth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file was included in the upload" });
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO expense_files (id, expense_key, filename, mime_type, file_data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, req.params.expenseKey, req.file.originalname, req.file.mimetype, req.file.buffer, req.userId]
    );
    res.json({ id, filename: req.file.originalname, mime_type: req.file.mimetype, size: req.file.size });
  });

  // Download/view a specific file
  app.get("/api/expenses/:expenseKey/files/:fileId", requireAuth, async (req, res) => {
    const { rows } = await pool.query(
      "SELECT filename, mime_type, file_data FROM expense_files WHERE id = $1 AND expense_key = $2",
      [req.params.fileId, req.params.expenseKey]
    );
    if (!rows[0]) return res.status(404).send("File not found");
    res.set("Content-Type", rows[0].mime_type || "application/octet-stream");
    res.set("Content-Disposition", `inline; filename="${encodeURIComponent(rows[0].filename)}"`);
    res.send(rows[0].file_data);
  });

  // Delete a file
  app.delete("/api/expenses/:expenseKey/files/:fileId", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM expense_files WHERE id = $1 AND expense_key = $2", [
      req.params.fileId,
      req.params.expenseKey,
    ]);
    res.json({ ok: true });
  });
}
