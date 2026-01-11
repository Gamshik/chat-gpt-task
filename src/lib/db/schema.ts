import { Database } from "bun:sqlite";

export function initDb(db: Database) {
  // Поддержка внешних ключей
  db.run("PRAGMA foreign_keys = ON");

  // Таблица чатов
  db.run(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица сообщений
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT,
      role TEXT CHECK(role IN ('user', 'assistant', 'system', 'tool')),
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
    )
  `);

  console.log("Database was initialized");
}
