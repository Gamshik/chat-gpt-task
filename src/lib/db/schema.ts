import { Database } from "bun:sqlite";

export function initDb(db: Database) {
  // поддержка внешних ключей
  db.run("PRAGMA foreign_keys = ON");

  // таблица чатов
  db.run(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) WITHOUT ROWID
  `);

  // таблица сообщений
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'tool')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
    ) WITHOUT ROWID
  `);

  // таблица частей сообщений
  db.run(`
    CREATE TABLE IF NOT EXISTS messages_parts (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,  
      type TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '',
      toolCallId TEXT NOT NULL DEFAULT '',
      input TEXT NOT NULL DEFAULT '',
      output TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    ) WITHOUT ROWID
  `);

  // на данный момент бесполезно создавать индексы, так как записей в бд очень мало
  // будет змедлять операции insert / update / delete
  // стоит добавить если в бд ожидается рост количества данных (> 1k)
  // db.run(`
  //   CREATE INDEX IF NOT EXISTS idx_messages_thread_id
  //   ON messages(thread_id)
  // `);

  // db.run(`
  //   CREATE INDEX IF NOT EXISTS idx_messages_parts_message_id
  //   ON messages_parts(message_id)
  // `);

  console.log("Database was initialized");
}
