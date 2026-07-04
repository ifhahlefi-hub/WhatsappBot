const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const loggers = require('../utils/logger');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

function generateTokens(user) {
    const payload = { id: user.id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' });
    return { accessToken, refreshToken };
}

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const user = db.prepare("SELECT * FROM admin_users WHERE email = ? AND deleted_at IS NULL AND status = 'Aktif'").get(email);
        
        if (!user) {
            loggers.auth.warn(`Gagal login (User tidak ditemukan): ${email} dari ${req.ip}`);
            return res.status(401).json({ success: false, message: 'Email atau password salah', error_code: 'AUTH_101' });
        }

        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
            loggers.auth.warn(`Gagal login (Password salah): ${email} dari ${req.ip}`);
            return res.status(401).json({ success: false, message: 'Email atau password salah', error_code: 'AUTH_102' });
        }

        // Update last login
        db.prepare("UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);
        
        // Audit log
        db.prepare("INSERT INTO audit_logs (admin_id, action, module, description, ip_address) VALUES (?, ?, ?, ?, ?)").run(
            user.id, 'Login', 'Auth', 'User berhasil login ke sistem', req.ip
        );

        loggers.auth.info(`Login sukses: ${email} dari ${req.ip}`);

        const tokens = generateTokens(user);
        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                tokens
            }
        });
    } catch (err) {
        loggers.error.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server', error_code: 'SYS_500' });
    }
});

router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token dibutuhkan', error_code: 'AUTH_201' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = db.prepare("SELECT * FROM admin_users WHERE id = ? AND deleted_at IS NULL AND status = 'Aktif'").get(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User tidak valid', error_code: 'AUTH_202' });
        }

        const tokens = generateTokens(user);
        res.json({
            success: true,
            message: 'Token berhasil di-refresh',
            data: { tokens }
        });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Refresh token expired atau tidak valid', error_code: 'AUTH_203' });
    }
});

router.get('/me', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Data user didapatkan',
        data: {
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        }
    });
});

router.put('/change-password', authenticate, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi', error_code: 'AUTH_301' });
    }

    try {
        const user = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan', error_code: 'AUTH_302' });
        }

        const isMatch = bcrypt.compareSync(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Password lama tidak sesuai', error_code: 'AUTH_303' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(newPassword, salt);

        db.prepare("UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(hash, req.user.id);
        
        // Audit log
        db.prepare("INSERT INTO audit_logs (admin_id, action, module, description, ip_address) VALUES (?, ?, ?, ?, ?)").run(
            req.user.id, 'Change Password', 'Auth', 'User mengganti password', req.ip
        );

        res.json({
            success: true,
            message: 'Password berhasil diubah'
        });
    } catch (err) {
        loggers.error.error('Change password error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server', error_code: 'SYS_500' });
    }
});

module.exports = router;
