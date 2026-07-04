const db = require('better-sqlite3')('database.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
const schema = tables.map(t => {
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  const fks = db.prepare(`PRAGMA foreign_key_list(${t.name})`).all();
  return { table: t.name, cols, fks };
});
console.log(JSON.stringify(schema, null, 2));
