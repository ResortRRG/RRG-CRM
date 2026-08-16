-- RRG CRM database schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'rep',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generic shared key-value store for all app data (contacts, sales, employees,
-- payroll overrides, attendance, settings). Mirrors the shape the frontend
-- already expects, so almost none of the app's business logic had to change.
CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user private data (e.g. which device/browser is unlocked) — not shared
-- across the team. Keyed by user id + data key.
CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
