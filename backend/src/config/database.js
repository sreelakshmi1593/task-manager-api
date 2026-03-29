const Database = require("better-sqlite3");  // ← CHANGED: was require("sqlite3").verbose()
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "app.db");
let _db = null;

function getDb() {
  if (_db) return _db;

  const raw = new Database(DB_PATH);  // ← CHANGED: no callback, just new Database(path)

  // ← CHANGED: no raw.serialize(), better-sqlite3 is synchronous
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");
  raw.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  raw.exec(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
    due_date TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  raw.exec("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)");
  raw.exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");

  const db = {
    prepare(sql) {
      return {
        get(...args) {
          // ← CHANGED: synchronous, no Promise needed
          return raw.prepare(sql).get(args.flat());
        },
        all(...args) {
          // ← CHANGED: synchronous, no Promise needed
          return raw.prepare(sql).all(args.flat()) || [];
        },
        run(...args) {
          // ← CHANGED: synchronous, no Promise needed
          return raw.prepare(sql).run(args.flat());
        },
      };
    },
  };

  _db = db;
  return db;
}

module.exports = { getDb };