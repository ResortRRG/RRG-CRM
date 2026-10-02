-- RRG CRM database schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'rep',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which campaign(s) a user belongs to: 'rrg', 'dfs', or 'both'. Accounts
-- with a single campaign skip the campaign picker and go straight in;
-- 'both' (existing admins, by default) still sees the picker.
ALTER TABLE users ADD COLUMN IF NOT EXISTS campaign TEXT NOT NULL DEFAULT 'rrg';
UPDATE users SET campaign = 'both' WHERE role = 'admin' AND campaign = 'rrg';

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

-- Business scripts (call scripts, talking points, etc.) uploaded under
-- Information → Scripts. A flat list, not tied to any other record — same
-- direct-in-database storage approach as employee_files and expense_files.
CREATE TABLE IF NOT EXISTS script_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_data BYTEA NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales, one row per sale. Previously the entire sales list lived as a
-- single JSON blob under the "crm:sales" key in app_data, read in full,
-- modified in memory, and written back in full on every change. Two people
-- changing different sales around the same moment would each start from
-- their own copy of that whole list and the later write would silently
-- overwrite whatever the earlier one had just added or changed — which is
-- what caused sales to vanish. With each sale as its own row, adding,
-- editing, or deleting one sale is a single atomic operation on that one
-- row; it cannot collide with anything happening to a different sale.
-- `data` holds everything about the sale except its id, exactly the same
-- shape the frontend has always used — this avoids a much larger, riskier
-- rewrite into individual typed columns for 30+ fields.
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
