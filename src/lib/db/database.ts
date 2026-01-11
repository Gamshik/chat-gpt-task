import { Database } from "bun:sqlite";
import { initDb } from "@db/schema";

// interface IGlobalWithDb {
//   _db?: Database;
// }

// const _globalWithDb = global as unknown as IGlobalWithDb;

// let chatDb: Database;

// if (process.env.NODE_ENV === "production") {
//   chatDb = new Database("chat.sqlite", { create: true });
//   initDb(chatDb);
// } else {
//   if (!_globalWithDb._db) {
//     _globalWithDb._db = new Database("chat.sqlite", { create: true });
//     initDb(_globalWithDb._db);
//   }

//   chatDb = _globalWithDb._db;
// }

// TODO: пофиксить инициализацию бд при каждом запросе в деве
const chatDb = new Database("chat.sqlite", { create: true });

initDb(chatDb);

export default chatDb;
