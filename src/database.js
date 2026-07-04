const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Database = require('better-sqlite3');
const fs = require('fs');
const bcrypt = require('bcrypt');

const rawDbPath = process.env.DATABASE_PATH || 'database.sqlite';
const DB_PATH = path.isAbsolute(rawDbPath) ? rawDbPath : path.resolve(path.join(__dirname, '..', rawDbPath));
const OLD_DB_PATH = path.join(__dirname, '..', 'db.json');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

function initDB() {
    // Check if tables exist
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    const isNewSetup = !tableCheck;

    // Create Tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            whatsapp_number TEXT,
            whatsapp_jid TEXT UNIQUE,
            push_name TEXT,
            profile_picture TEXT,
            role TEXT DEFAULT 'User',
            status TEXT DEFAULT 'Aktif',
            last_active DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            message_type TEXT,
            message TEXT,
            sender TEXT,
            status TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            response_time INTEGER,
            deleted_at DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            description TEXT,
            amount INTEGER,
            created_by INTEGER,
            status TEXT DEFAULT 'Selesai',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME,
            FOREIGN KEY(created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT,
            status TEXT DEFAULT 'Aktif',
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER,
            action TEXT,
            module TEXT,
            description TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(admin_id) REFERENCES admin_users(id)
        );

        CREATE TABLE IF NOT EXISTS whatsapp_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_name TEXT UNIQUE,
            device_name TEXT,
            phone_number TEXT,
            status TEXT DEFAULT 'Disconnected',
            qr_code TEXT,
            last_connected DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // --- PHASE 2 MIGRATIONS ---
    // Safe schema alterations for existing DBs
    const migrations = [
        // 1. Roles table
        `CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        // 1b. User Roles table (RBAC)
        `CREATE TABLE IF NOT EXISTS user_roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            role_id INTEGER REFERENCES roles(id),
            assigned_by INTEGER,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        // 2. Add columns to users
        `ALTER TABLE users ADD COLUMN total_tokens INTEGER DEFAULT 0;`,
        `ALTER TABLE users ADD COLUMN prompt_tokens INTEGER DEFAULT 0;`,
        `ALTER TABLE users ADD COLUMN completion_tokens INTEGER DEFAULT 0;`,
        `ALTER TABLE users ADD COLUMN ai_cost REAL DEFAULT 0;`,
        `ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);`,
        // 3. Add role_id to admin_users
        `ALTER TABLE admin_users ADD COLUMN role_id INTEGER REFERENCES roles(id);`,
        // 4. Update audit_logs schema
        `ALTER TABLE audit_logs ADD COLUMN target_id INTEGER;`,
        `ALTER TABLE audit_logs ADD COLUMN old_value TEXT;`,
        `ALTER TABLE audit_logs ADD COLUMN new_value TEXT;`,
        `ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;`,
        // 5. Update chat_history schema
        `ALTER TABLE chat_history ADD COLUMN prompt_tokens INTEGER DEFAULT 0;`,
        `ALTER TABLE chat_history ADD COLUMN completion_tokens INTEGER DEFAULT 0;`,
        `ALTER TABLE chat_history ADD COLUMN total_tokens INTEGER DEFAULT 0;`,
        `ALTER TABLE chat_history ADD COLUMN ai_model TEXT;`
    ];

    for (const sql of migrations) {
        try {
            db.exec(sql);
        } catch (e) {
            // Ignore errors for existing columns
            if (!e.message.includes("duplicate column name") && !e.message.includes("already exists")) {
                console.error("[DB] Migration error:", e.message);
            }
        }
    }

    // Seed Default Roles
    const rolesCount = db.prepare("SELECT COUNT(*) as count FROM roles").get().count;
    if (rolesCount === 0) {
        console.log('[DB] Seeding default roles...');
        const insertRole = db.prepare("INSERT INTO roles (name, description) VALUES (?, ?)");
        insertRole.run('Super Admin', 'Full access to all system features');
        insertRole.run('Admin', 'Manage everything except Super Admins');
        insertRole.run('Moderator', 'Manage users and chats, cannot edit system configs');
        insertRole.run('Support', 'View and reply to chats');
        insertRole.run('Viewer', 'Read only access to dashboard');
    }
    
    // Map existing admin_users string role to role_id and populate user_roles
    try {
        db.exec(`
            UPDATE admin_users 
            SET role_id = (SELECT id FROM roles WHERE roles.name = admin_users.role)
            WHERE role_id IS NULL AND role IS NOT NULL;
            
            INSERT INTO user_roles (user_id, role_id)
            SELECT id, role_id FROM admin_users 
            WHERE role_id IS NOT NULL 
            AND id NOT IN (SELECT user_id FROM user_roles);
        `);
    } catch(e) {}

    if (isNewSetup) {
        console.log('[DB] Menginisialisasi tabel-tabel SQLite baru...');
        migrateOldData();
    }

    // Selalu jalankan seedSuperAdmin, karena fungsinya sudah mengecek apakah adminCount === 0
    seedSuperAdmin();
}

function generateRandomPassword(length = 16) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    // Ensure at least one of each required character type
    password += "A"; // Uppercase
    password += "a"; // Lowercase
    password += "1"; // Number
    password += "!"; // Symbol
    
    for (let i = 4; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    // Shuffle the string
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

function seedSuperAdmin() {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM admin_users").get().count;
    if (adminCount === 0) {
        const defaultEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@localhost';
        const rawPassword = generateRandomPassword(16);
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(rawPassword, salt);

        db.prepare(`
            INSERT INTO admin_users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        `).run('Super Admin', defaultEmail, hash, 'Super Admin');

        console.log('\n==============================');
        console.log('SUPER ADMIN CREATED');
        console.log(`Email: ${defaultEmail}`);
        console.log(`Temporary Password: ${rawPassword}`);
        console.log('Silakan login dan segera ubah password.');
        console.log('=======================================\n');
    }
}

function migrateOldData() {
    if (fs.existsSync(OLD_DB_PATH)) {
        console.log('[DB] Ditemukan db.json, memulai migrasi...');
        try {
            const raw = fs.readFileSync(OLD_DB_PATH, 'utf-8');
            const data = JSON.parse(raw);
            const users = data.users || {};

            const insertUser = db.prepare(`
                INSERT INTO users (whatsapp_jid, whatsapp_number, role, status)
                VALUES (?, ?, 'User', 'Aktif')
            `);

            const insertExpense = db.prepare(`
                INSERT INTO expenses (category, description, amount, created_by, created_at)
                VALUES ('Umum', ?, ?, ?, ?)
            `);

            db.transaction(() => {
                for (const jid in users) {
                    if (jid === '_legacy') continue;
                    
                    const u = users[jid];
                    const rawNumber = jid.split('@')[0];
                    
                    try {
                        const result = insertUser.run(jid, rawNumber);
                        const userId = result.lastInsertRowid;

                        if (u.pengeluaran && Array.isArray(u.pengeluaran)) {
                            for (const exp of u.pengeluaran) {
                                // Fallback date if null
                                const dateStr = exp.waktu || exp.tanggal || new Date().toISOString();
                                insertExpense.run(
                                    exp.keterangan || '-',
                                    exp.nominal || 0,
                                    userId,
                                    dateStr
                                );
                            }
                        }
                    } catch(e) {
                        console.error(`[DB] Gagal migrasi user ${jid}: ${e.message}`);
                    }
                }
            })();

            // Backup db.json
            const dateStr = new Date().toISOString().replace(/[:.]/g, '').slice(0,8);
            const backupPath = path.join(__dirname, '..', `db_backup_${dateStr}.json`);
            fs.renameSync(OLD_DB_PATH, backupPath);
            console.log(`[DB] Migrasi selesai. db.json di-backup ke ${backupPath}`);

        } catch (err) {
            console.error('[DB] Gagal migrasi db.json:', err.message);
        }
    }
}

// User wrapper functions to bridge old logic if needed temporarily
function getUserDataByJid(jid) {
    let user = db.prepare("SELECT * FROM users WHERE whatsapp_jid = ? AND deleted_at IS NULL").get(jid);
    if (!user) {
        let rawNumber = jid.split('@')[0];
        if (!rawNumber.startsWith('+')) rawNumber = '+' + rawNumber;
        const result = db.prepare("INSERT INTO users (whatsapp_jid, whatsapp_number) VALUES (?, ?)").run(jid, rawNumber);
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    }
    return user;
}

function updateLastActive(jid, pushName, profilePic) {
    db.prepare(`
        UPDATE users 
        SET last_active = CURRENT_TIMESTAMP, 
            push_name = COALESCE(?, push_name), 
            profile_picture = COALESCE(?, profile_picture)
        WHERE whatsapp_jid = ?
    `).run(pushName, profilePic, jid);
}

module.exports = { 
    db, 
    initDB, 
    getUserDataByJid, 
    updateLastActive
};
