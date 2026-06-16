-- ============================================================
-- ASMBEL 2.0 — Employee Dummy Database
-- Engine: SQLite (local dev) | PostgreSQL-compatible syntax
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_number   TEXT    NOT NULL UNIQUE,         -- e.g. SDS250
  full_name    TEXT    NOT NULL,
  email        TEXT    NOT NULL UNIQUE,
  date_joined  TEXT    NOT NULL,                -- ISO-8601: YYYY-MM-DD
  is_active    INTEGER NOT NULL DEFAULT 1,      -- 1 = active, 0 = inactive
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Auto-update updated_at on every row change
CREATE TRIGGER IF NOT EXISTS trg_employees_updated_at
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
  UPDATE employees SET updated_at = datetime('now') WHERE id = OLD.id;
END;