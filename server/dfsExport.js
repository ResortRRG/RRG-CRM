import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

// One-time export used to migrate DFS into its own separate database. Pulls
// every user whose campaign includes DFS, plus every dfs:*-prefixed key in
// app_data, as a single downloadable JSON file. Admin-only, since this
// includes password hashes (still bcrypt-hashed, never plaintext, but still
// sensitive enough to gate). Safe to delete this file (and its one line in
// index.js) once the migration is done — it's not needed for normal
// operation and isn't referenced anywhere else.
export function registerDfsExportRoutes(app) {
  app.get("/api/admin/export-dfs-data", requireAuth, async (req, res) => {
    const { rows: me } = await pool.query("SELECT role FROM users WHERE id = $1", [req.userId]);
    if (!me[0] || me[0].role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { rows: users } = await pool.query(
      "SELECT id, name, username, password_hash, role, created_at FROM users WHERE campaign IN ('dfs','both') ORDER BY created_at ASC"
    );
    const { rows: appDataRows } = await pool.query("SELECT key, value FROM app_data WHERE key LIKE 'dfs:%'");
    const appData = {};
    appDataRows.forEach((r) => {
      appData[r.key] = r.value;
    });

    res.setHeader("Content-Disposition", 'attachment; filename="dfs-export.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        password_hash: u.password_hash,
        role: u.role,
        created_at: u.created_at,
      })),
      appData,
    });
  });
}
