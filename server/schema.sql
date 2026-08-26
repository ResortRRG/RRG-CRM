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

-- Employee document attachments (ID copies, signed work agreements, etc.)
-- Files are stored directly in the database — fine for a small team's worth
-- of PDFs/images, no separate file storage service needed.
CREATE TABLE IF NOT EXISTS employee_files (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_data BYTEA NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employee_files_employee_id ON employee_files(employee_id);

-- Receipt/invoice attachments for Profit & Loss expense categories, keyed by
-- an expense_key like "2026-08_Rent" (month + category). Same storage
-- approach as employee_files — small team's worth of receipts fits fine
-- directly in the database.
CREATE TABLE IF NOT EXISTS expense_files (
  id TEXT PRIMARY KEY,
  expense_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_data BYTEA NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expense_files_expense_key ON expense_files(expense_key);
