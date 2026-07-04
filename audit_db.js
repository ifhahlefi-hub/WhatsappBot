const db = require('better-sqlite3')('database.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("=== DATABASE AUDIT ===");
tables.forEach(t => {
    try {
        const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
        const columns = db.prepare(`PRAGMA table_info(${t.name})`).all();
        console.log(`${t.name}: ${count} records`);
        console.log(`Columns: ${columns.map(c => c.name).join(', ')}`);
        console.log('----------------');
    } catch(e) {
        console.log(`Error reading ${t.name}: ${e.message}`);
    }
});
