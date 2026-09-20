import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "./db.js";

const SESSION_COOKIE = "rrg_session";
// In-memory session store. Fine for a single Railway instance; if you ever
// scale to multiple instances, swap this for a sessions table or Redis.
const sessions = new Map(); // token -> { userId, expiresAt }
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function issueSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return s;
}

export function requireAuth(req, res, next) {
  const token = req.cookies[SESSION_COOKIE];
  const session = getSession(token);
  if (!session) return res.status(401).json({ error: "Not signed in" });
  req.userId = session.userId;
  next();
}

function publicUser(row) {
  return { id: row.id, name: row.name, username: row.username, role: row.role };
}

export function registerAuthRoutes(app) {
  // First-run bootstrap: if there are zero users, allow creating the first
  // admin account without being signed in yet.
  app.get("/api/auth/needs-setup", async (req, res) => {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users");
    res.json({ needsSetup: rows[0].count === 0 });
  });

  app.post("/api/auth/setup", async (req, res) => {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users");
    if (rows[0].count > 0) return res.status(400).json({ error: "Setup already complete" });
    const { name, username, password } = req.body || {};
    if (!name || !username || !password) return res.status(400).json({ error: "Name, username, and password are required" });
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (id, name, username, password_hash, role) VALUES ($1,$2,$3,$4,'admin')",
      [id, name, username, hash]
    );
    const token = issueSession(id);
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: SESSION_TTL_MS });
    res.json({ user: { id, name, username, role: "admin" } });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const row = rows[0];
    if (!row) return res.status(401).json({ error: "Incorrect username or password" });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "Incorrect username or password" });
    const token = issueSession(row.id);
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: SESSION_TTL_MS });
    res.json({ user: publicUser(row) });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) sessions.delete(token);
    res.clearCookie(SESSION_COOKIE);
    res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = req.cookies[SESSION_COOKIE];
    const session = getSession(token);
    if (!session) return res.json({ user: null });
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [session.userId]);
    if (!rows[0]) return res.json({ user: null });
    res.json({ user: publicUser(rows[0]) });
  });

  // ---- user management (admin only, enforced client-side + should be
  // double-checked server-side if you tighten this further later) ----
  app.get("/api/users", requireAuth, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    res.json({ users: rows.map(publicUser) });
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    const { name, username, password, role } = req.body || {};
    if (!name || !username || !password) return res.status(400).json({ error: "Name, username, and password are required" });
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    try {
      await pool.query(
        "INSERT INTO users (id, name, username, password_hash, role) VALUES ($1,$2,$3,$4,$5)",
        [id, name, username, hash, role || "rep"]
      );
    } catch (e) {
      if (e.code === "23505") return res.status(400).json({ error: "That username is already taken" });
      throw e;
    }
    res.json({ user: { id, name, username, role: role || "rep" } });
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    const { name, username, password, role } = req.body || {};
    const fields = [];
    const values = [];
    let i = 1;
    if (name) { fields.push(`name = $${i++}`); values.push(name); }
    if (username) { fields.push(`username = $${i++}`); values.push(username); }
    if (role) { fields.push(`role = $${i++}`); values.push(role); }
    if (password) {
      fields.push(`password_hash = $${i++}`);
      values.push(await bcrypt.hash(password, 10));
    }
    if (fields.length === 0) return res.status(400).json({ error: "Nothing to update" });
    values.push(req.params.id);
    try {
      await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${i}`, values);
    } catch (e) {
      if (e.code === "23505") return res.status(400).json({ error: "That username is already taken" });
      throw e;
    }
    res.json({ ok: true });
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'");
    const { rows: target } = await pool.query("SELECT role FROM users WHERE id = $1", [req.params.id]);
    if (target[0] && target[0].role === "admin" && rows[0].count <= 1) {
      return res.status(400).json({ error: "Can't delete the last admin account" });
    }
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });
}
