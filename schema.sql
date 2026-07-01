-- Meraqi beta waitlist — Cloudflare D1 (SQLite) schema
-- Run once:  wrangler d1 execute meraqi-waitlist --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,          -- normalized lowercase; UNIQUE de-dupes signups
  source     TEXT,                          -- where the signup came from (e.g. meraqi.ai)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))  -- UTC ISO timestamp
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist (created_at);
