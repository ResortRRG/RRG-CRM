import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

// These routes intentionally mirror the shape of the old Claude-artifact
// window.storage.get/set(key, shared) API, so the frontend's data layer
// needed almost no changes — just swap the implementation for fetch calls.

export function registerStorageRoutes(app) {
  app.get("/api/storage", requireAuth, async (req, res) => {
    const { key, shared } = req.query;
    if (!key) return res.status(400).json({ error: "key is required" });
    if (shared === "true") {
      const { rows } = await pool.query("SELECT value FROM app_data WHERE key = $1", [key]);
      if (!rows[0]) return res.json({ value: null });
      return res.json({ value: rows[0].value });
    } else {
      const { rows } = await pool.query("SELECT value FROM user_data WHERE user_id = $1 AND key = $2", [req.userId, key]);
      if (!rows[0]) return res.json({ value: null });
      return res.json({ value: rows[0].value });
    }
  });

  app.post("/api/storage", requireAuth, async (req, res) => {
    const { key, value, shared } = req.body || {};
    if (!key) return res.status(400).json({ error: "key is required" });
    if (shared) {
      await pool.query(
        `INSERT INTO app_data (key, value, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
        [key, JSON.stringify(value)]
      );
    } else {
      await pool.query(
        `INSERT INTO user_data (user_id, key, value, updated_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (user_id, key) DO UPDATE SET value = $3, updated_at = now()`,
        [req.userId, key, JSON.stringify(value)]
      );
    }
    res.json({ ok: true });
  });
}
