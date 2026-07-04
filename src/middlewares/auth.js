const jwt = require('jsonwebtoken');
const { db } = require('../database');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const tokenFromQuery = req.query.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (tokenFromQuery) {
        token = tokenFromQuery;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token tidak valid atau hilang', error_code: 'AUTH_001' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Cek user di DB dan apakah token masih aktif (tidak diblokir, last_login belum logout)
        const userQuery = `
            SELECT a.*, r.name as role_name
            FROM admin_users a
            LEFT JOIN user_roles ur ON a.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE a.id = ? AND a.deleted_at IS NULL AND a.status = 'Aktif'
        `;
        const user = db.prepare(userQuery).get(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Akun tidak aktif atau tidak ditemukan', error_code: 'AUTH_002' });
        }
        
        req.user = user;
        req.user.role = user.role_name || user.role; // Fallback ke role text jika user_roles tidak ada
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expired atau tidak valid', error_code: 'AUTH_003' });
    }
}

module.exports = {
    authenticate
};
