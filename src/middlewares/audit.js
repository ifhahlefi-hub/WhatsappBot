const { db } = require('../database');

function auditLog(req, res, next) {
    if (req.method === 'GET') {
        return next(); // Hanya audit aksi perubahan data
    }

    const originalJson = res.json;
    res.json = function (body) {
        res.json = originalJson;

        if (req.user && res.statusCode >= 200 && res.statusCode < 400) {
            let action = req.method;
            let moduleName = req.baseUrl + req.path;
            
            if (req.method === 'POST') action = 'CREATE';
            if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
            if (req.method === 'DELETE') action = 'DELETE';

            const description = `${action} on ${moduleName}`;
            let targetId = req.params.id || req.body.id || null;

            try {
                db.prepare(`
                    INSERT INTO audit_logs (admin_id, action, module, description, ip_address, target_id, new_value, user_agent)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    req.user.id,
                    action,
                    moduleName,
                    description,
                    req.ip,
                    targetId,
                    JSON.stringify(req.body),
                    req.headers['user-agent'] || 'Unknown'
                );
            } catch (err) {
                console.error('[AUDIT ERROR]', err);
            }
        }
        
        return res.json(body);
    };
    
    next();
}

module.exports = { auditLog };
