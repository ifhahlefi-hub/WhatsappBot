const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'database.sqlite'));

console.log('=== ADMIN USERS ===');
console.log(JSON.stringify(db.prepare('SELECT id, name, email, role, role_id, status FROM admin_users').all(), null, 2));

console.log('\n=== USER_ROLES ===');
console.log(JSON.stringify(db.prepare('SELECT * FROM user_roles').all(), null, 2));

console.log('\n=== ROLES ===');
console.log(JSON.stringify(db.prepare('SELECT * FROM roles').all(), null, 2));

// Simulate what the auth middleware does
console.log('\n=== SIMULATED AUTH QUERY (for admin id=1) ===');
const user = db.prepare(`
    SELECT a.*, r.name as role_name
    FROM admin_users a
    LEFT JOIN user_roles ur ON a.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE a.id = 1 AND a.deleted_at IS NULL AND a.status = 'Aktif'
`).get();
console.log(JSON.stringify(user, null, 2));
console.log('Resolved role:', user?.role_name || user?.role || 'NONE');

// Test dashboard stats query directly
console.log('\n=== DASHBOARD STATS QUERY TEST ===');
const today = new Date().toISOString().slice(0, 10);
console.log('today:', today);
const totalUsers = db.prepare("SELECT COUNT(DISTINCT whatsapp_number) as count FROM users WHERE deleted_at IS NULL").get();
console.log('totalUsers:', totalUsers);

const todayMsgIn = db.prepare("SELECT COUNT(*) as count FROM chat_history WHERE date(timestamp) = ? AND sender = 'user' AND deleted_at IS NULL").get(today);
console.log('todayMsgIn:', todayMsgIn);

const todayMsgOut = db.prepare("SELECT COUNT(*) as count FROM chat_history WHERE date(timestamp) = ? AND sender = 'bot' AND deleted_at IS NULL").get(today);
console.log('todayMsgOut:', todayMsgOut);

// Check timestamp format
console.log('\n=== TIMESTAMP FORMAT CHECK ===');
const sample = db.prepare("SELECT timestamp FROM chat_history ORDER BY id DESC LIMIT 3").all();
console.log('Sample timestamps:', JSON.stringify(sample));
console.log('JS today format:', today);
console.log('Do they match? timestamp format = YYYY-MM-DD HH:MM:SS, date() should extract YYYY-MM-DD');

// Test date() function
const dateTest = db.prepare("SELECT date('2026-06-17 12:21:59') as d").get();
console.log('date() test:', dateTest);

db.close();
