const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { initDB, db } = require('../src/database');

initDB();

const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || 'superadmin@localhost';
const rawPassword = process.argv[3] || crypto.randomBytes(8).toString('hex'); // 16 chars

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(rawPassword, salt);

// Check if exists
const existing = db.prepare("SELECT * FROM admin_users WHERE email = ?").get(email);
    if (existing) {
        db.prepare("UPDATE admin_users SET password_hash = ?, role = 'Super Admin' WHERE email = ?").run(hash, email);
        console.log('\n==============================');
        console.log('SUPER ADMIN PASSWORD RESET');
    } else {
        db.prepare("INSERT INTO admin_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run('Super Admin', email, hash, 'Super Admin');
        console.log('\n==============================');
        console.log('SUPER ADMIN CREATED');
    }

    console.log(`Email: ${email}`);
    console.log(`Temporary Password: ${rawPassword}`);
    console.log('Silakan login dan segera ubah password.');
    console.log('=======================================\n');
