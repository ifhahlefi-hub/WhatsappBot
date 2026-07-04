const express = require('express');
const { db } = require('../database');
const { authenticate } = require('../middlewares/auth');
const {
  canExportExcel,
  canManageRoles,
  canManageUsers,
  canViewAudit,
  canViewChats,
  canManageExpenses,
  canViewChatHistory,
  canViewAnalytics,
  canViewUsers,
  canManageSystem
} = require('../middlewares/permissions');
const { auditLog } = require('../middlewares/audit');

const router = express.Router();

// Helper: Get current date/time in WIB (Asia/Jakarta, UTC+7)
function getWIBDate() {
    const now = new Date();
    // Format in WIB timezone
    const wibDate = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }); // 'sv-SE' gives YYYY-MM-DD format
    return wibDate; // e.g. '2026-06-17'
}

// SQLite stores CURRENT_TIMESTAMP in UTC.
// To compare "today" in WIB, we offset the stored UTC timestamps by +7 hours before extracting the date.
const WIB_OFFSET = "'+7 hours'"; // Used in SQL: datetime(timestamp, '+7 hours')

router.use(auditLog); // Apply audit log to all API routes

// DASHBOARD STATS
router.get('/dashboard/stats', authenticate, canViewAnalytics, (req, res) => {
    try {
        const today = getWIBDate(); // WIB date, not UTC
        const startOfMonth = today.slice(0, 7) + '-01';
        
        // Users Stat
        const totalUsers = db.prepare("SELECT COUNT(DISTINCT whatsapp_number) as count FROM users WHERE deleted_at IS NULL").get().count;
        const active5m = db.prepare("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND (strftime('%s', 'now') - strftime('%s', last_active)) < 300").get().count;
        const active1h = db.prepare("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND (strftime('%s', 'now') - strftime('%s', last_active)) < 3600").get().count;
        const active24h = db.prepare("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND (strftime('%s', 'now') - strftime('%s', last_active)) < 86400").get().count;
        const active7d = db.prepare("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND (strftime('%s', 'now') - strftime('%s', last_active)) < 604800").get().count;
        const newUsersToday = db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at, '+7 hours') = ?").get(today).count;
        const newUsersMonth = db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at, '+7 hours') >= ?").get(startOfMonth).count;
        
        // Messages Stat — offset timestamp by +7h to get WIB date
        const todayMsgIn = db.prepare("SELECT COUNT(*) as count FROM chat_history WHERE date(timestamp, '+7 hours') = ? AND sender = 'user' AND deleted_at IS NULL").get(today).count;
        const todayMsgOut = db.prepare("SELECT COUNT(*) as count FROM chat_history WHERE date(timestamp, '+7 hours') = ? AND sender = 'bot' AND deleted_at IS NULL").get(today).count;
        const todayMessages = todayMsgIn + todayMsgOut;
        const monthMessages = db.prepare("SELECT COUNT(*) as count FROM chat_history WHERE date(timestamp, '+7 hours') >= ? AND deleted_at IS NULL").get(startOfMonth).count;

        // AI Usage Stat
        const aiToday = db.prepare("SELECT SUM(prompt_tokens) as p_tokens, SUM(completion_tokens) as c_tokens, SUM(total_tokens) as t_tokens FROM chat_history WHERE date(timestamp, '+7 hours') = ? AND deleted_at IS NULL").get(today);
        const aiMonth = db.prepare("SELECT SUM(prompt_tokens) as p_tokens, SUM(completion_tokens) as c_tokens, SUM(total_tokens) as t_tokens FROM chat_history WHERE date(timestamp, '+7 hours') >= ? AND deleted_at IS NULL").get(startOfMonth);

        // This Month Expenses
        const expenseToday = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE deleted_at IS NULL AND date(created_at, '+7 hours') = ?").get(today).total || 0;
        const expenseMonth = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE deleted_at IS NULL AND date(created_at, '+7 hours') >= ?").get(startOfMonth).total || 0;
        const expenseTotal = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE deleted_at IS NULL").get().total || 0;

        // Message Trend (Last 30 Days) — group by WIB date
        const trendQuery = db.prepare(`
            SELECT date(timestamp, '+7 hours') as date, COUNT(*) as count 
            FROM chat_history 
            WHERE deleted_at IS NULL AND timestamp >= datetime('now', '-30 days')
            GROUP BY date(timestamp, '+7 hours') ORDER BY date ASC
        `).all();

        // User Growth (Last 30 Days) — group by WIB date
        const userGrowthQuery = db.prepare(`
            SELECT date(created_at, '+7 hours') as date, COUNT(*) as count 
            FROM users 
            WHERE deleted_at IS NULL AND created_at >= datetime('now', '-30 days')
            GROUP BY date(created_at, '+7 hours') ORDER BY date ASC
        `).all();

        // Top Active Users
        const topUsers = db.prepare(`
            SELECT u.whatsapp_number, u.push_name, COUNT(c.id) as msg_count 
            FROM users u
            LEFT JOIN chat_history c ON c.user_id = u.id AND c.deleted_at IS NULL
            WHERE u.deleted_at IS NULL
            GROUP BY u.id ORDER BY msg_count DESC LIMIT 10
        `).all();

        // Most Expensive Users
        const expensiveUsers = db.prepare(`
            SELECT u.whatsapp_number, u.push_name, SUM(c.total_tokens) as total_tokens 
            FROM users u
            LEFT JOIN chat_history c ON c.user_id = u.id AND c.deleted_at IS NULL
            WHERE u.deleted_at IS NULL
            GROUP BY u.id ORDER BY total_tokens DESC LIMIT 10
        `).all();

        // Provider Stats (Cost/Tokens By Provider)
        const providerStats = db.prepare(`
            SELECT 
                CASE 
                    WHEN ai_model LIKE '%gpt%' THEN 'OpenAI'
                    WHEN ai_model LIKE '%gemini%' THEN 'Gemini'
                    WHEN ai_model LIKE '%claude%' THEN 'Anthropic'
                    ELSE 'Other'
                END as provider,
                SUM(total_tokens) as tokens
            FROM chat_history
            WHERE deleted_at IS NULL AND ai_model IS NOT NULL
            GROUP BY provider
        `).all();

        // Top Commands
        const topCommands = db.prepare(`
            SELECT message, COUNT(*) as count 
            FROM chat_history 
            WHERE sender = 'user' AND (message LIKE '/%' OR message LIKE '!%') AND deleted_at IS NULL
            GROUP BY message ORDER BY count DESC LIMIT 10
        `).all();

        res.json({
            success: true,
            message: 'Stats retrieved',
            data: {
                totalUsers,
                activeUsers: { '5m': active5m, '1h': active1h, '24h': active24h, '7d': active7d },
                newUsers: { today: newUsersToday, month: newUsersMonth },
                messages: { inToday: todayMsgIn, outToday: todayMsgOut, totalToday: todayMessages, totalMonth: monthMessages },
                aiUsage: { 
                    today: { prompt: aiToday.p_tokens||0, completion: aiToday.c_tokens||0, total: aiToday.t_tokens||0 },
                    month: { prompt: aiMonth.p_tokens||0, completion: aiMonth.c_tokens||0, total: aiMonth.t_tokens||0 }
                },
                expenses: { today: expenseToday, month: expenseMonth, total: expenseTotal },
                providerStats,
                messageTrend: trendQuery,
                userGrowth: userGrowthQuery,
                topUsers,
                expensiveUsers,
                topCommands
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error_code: 'SYS_500' });
    }
});

// ROLES
router.get('/roles', authenticate, canManageSystem, (req, res) => {
    try {
        const roles = db.prepare(`
            SELECT r.*, COUNT(ur.id) as user_count 
            FROM roles r 
            LEFT JOIN user_roles ur ON r.id = ur.role_id 
            GROUP BY r.id ORDER BY r.id ASC
        `).all();
        
        const assignments = db.prepare(`
            SELECT ur.id, ur.user_id, ur.role_id, a.name as admin_name, a.email, r.name as role_name, ur.assigned_at
            FROM user_roles ur
            JOIN admin_users a ON ur.user_id = a.id
            JOIN roles r ON ur.role_id = r.id
        `).all();

        assignments.forEach(a => {
            if (a.assigned_at && !a.assigned_at.endsWith('Z')) a.assigned_at += 'Z';
        });

        res.json({ success: true, data: { roles, assignments } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error_code: 'SYS_500' });
    }
});

router.post('/roles/assign', authenticate, canManageSystem, (req, res) => {
    try {
        const { user_id, role_id } = req.body;
        // Cek jika sudah ada
        const exists = db.prepare("SELECT id FROM user_roles WHERE user_id = ?").get(user_id);
        if (exists) {
            db.prepare("UPDATE user_roles SET role_id = ?, assigned_by = ? WHERE user_id = ?").run(role_id, req.user.id, user_id);
        } else {
            db.prepare("INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)").run(user_id, role_id, req.user.id);
        }
        res.json({ success: true, message: 'Role assigned successfully' });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/roles/assign/:id', authenticate, canManageSystem, (req, res) => {
    try {
        const id = req.params.id;
        db.prepare("DELETE FROM user_roles WHERE id = ?").run(id);
        res.json({ success: true, message: 'Role removed' });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/roles/assign-wa-user', authenticate, canManageSystem, (req, res) => {
    try {
        const { user_id, role_id } = req.body;
        db.prepare("UPDATE users SET role_id = ? WHERE id = ?").run(role_id, user_id);
        res.json({ success: true, message: 'Role assigned to WA user successfully' });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN USERS (For Role Assignment)
router.get('/admin-users', authenticate, canManageSystem, (req, res) => {
    try {
        const admins = db.prepare("SELECT id, name, email, role FROM admin_users WHERE deleted_at IS NULL").all();
        res.json({ success: true, data: admins });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// USERS LIST
router.get('/users', authenticate, canViewUsers, (req, res) => {
    try {
        const { search = '', page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT u.*, r.name as role_name,
                   (SELECT COUNT(*) FROM chat_history c WHERE c.user_id = u.id AND c.sender = 'user') as total_in,
                   (SELECT COUNT(*) FROM chat_history c WHERE c.user_id = u.id AND c.sender = 'bot') as total_out
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.deleted_at IS NULL AND (u.whatsapp_number LIKE ? OR u.push_name LIKE ?)
            ORDER BY u.last_active DESC
            LIMIT ? OFFSET ?
        `;
        
        const countQuery = `
            SELECT COUNT(*) as count 
            FROM users u
            WHERE u.deleted_at IS NULL AND (u.whatsapp_number LIKE ? OR u.push_name LIKE ?)
        `;
        
        const searchPattern = `%${search}%`;
        const users = db.prepare(query).all(searchPattern, searchPattern, limit, offset);
        const total = db.prepare(countQuery).get(searchPattern, searchPattern).count;

        // Parse JID to Phone Number
        users.forEach(u => {
            if (u.whatsapp_jid && !u.whatsapp_number) {
                u.whatsapp_number = '+' + u.whatsapp_jid.split('@')[0];
            } else if (u.whatsapp_number && !u.whatsapp_number.startsWith('+')) {
                u.whatsapp_number = '+' + u.whatsapp_number;
            }
            if (u.last_active && !u.last_active.endsWith('Z')) u.last_active += 'Z';
            if (u.created_at && !u.created_at.endsWith('Z')) u.created_at += 'Z';
        });

        res.json({
            success: true,
            message: 'Users retrieved',
            data: {
                users,
                pagination: { total, page: Number(page), limit: Number(limit) }
            }
        });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error', error_code: 'SYS_500' });
    }
});

// USER DETAIL
router.get('/users/:id', authenticate, canViewUsers, (req, res) => {
    try {
        const user = db.prepare(`
            SELECT u.*, r.name as role_name,
                   (SELECT COUNT(*) FROM chat_history c WHERE c.user_id = u.id AND c.sender = 'user') as total_in,
                   (SELECT COUNT(*) FROM chat_history c WHERE c.user_id = u.id AND c.sender = 'bot') as total_out,
                   (SELECT SUM(total_tokens) FROM chat_history c WHERE c.user_id = u.id) as sum_tokens
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.deleted_at IS NULL
        `).get(req.params.id);
        
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        // Favorite active hour
        const favHour = db.prepare(`
            SELECT strftime('%H', timestamp, '+7 hours') as hour, COUNT(*) as count
            FROM chat_history 
            WHERE user_id = ? AND sender = 'user' AND deleted_at IS NULL
            GROUP BY hour ORDER BY count DESC LIMIT 1
        `).get(user.id);

        // Favorite command
        const favCmd = db.prepare(`
            SELECT message, COUNT(*) as count
            FROM chat_history 
            WHERE user_id = ? AND sender = 'user' AND (message LIKE '/%' OR message LIKE '!%') AND deleted_at IS NULL
            GROUP BY message ORDER BY count DESC LIMIT 1
        `).get(user.id);

        // Recent 20 conversations
        const recentChats = db.prepare(`
            SELECT * FROM chat_history 
            WHERE user_id = ? AND deleted_at IS NULL 
            ORDER BY timestamp DESC LIMIT 20
        `).all(user.id);

        // Format JID
        if (user.whatsapp_jid && !user.whatsapp_number) {
            user.whatsapp_number = '+' + user.whatsapp_jid.split('@')[0];
        } else if (user.whatsapp_number && !user.whatsapp_number.startsWith('+')) {
            user.whatsapp_number = '+' + user.whatsapp_number;
        }
        
        if (user.last_active && !user.last_active.endsWith('Z')) user.last_active += 'Z';
        if (user.created_at && !user.created_at.endsWith('Z')) user.created_at += 'Z';

        user.favorite_hour = favHour ? favHour.hour : null;
        user.favorite_command = favCmd ? favCmd.message : null;
        user.recent_chats = recentChats;

        user.recent_chats.forEach(c => {
            if (c.timestamp && !c.timestamp.endsWith('Z')) c.timestamp += 'Z';
        });

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// CHAT HISTORY
router.get('/chats', authenticate, canViewChatHistory, (req, res) => {
    try {
        const { search = '', page = 1, limit = 100, user_id } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*, u.push_name, u.whatsapp_number, u.profile_picture 
            FROM chat_history c 
            LEFT JOIN users u ON c.user_id = u.id 
            WHERE c.deleted_at IS NULL AND c.message LIKE ?
        `;
        
        let countQuery = `
            SELECT COUNT(*) as count 
            FROM chat_history c 
            WHERE c.deleted_at IS NULL AND c.message LIKE ?
        `;
        
        const params = [`%${search}%`];

        if (user_id) {
            query += " AND c.user_id = ?";
            countQuery += " AND c.user_id = ?";
            params.push(user_id);
        }

        query += " ORDER BY c.timestamp DESC LIMIT ? OFFSET ?";
        
        const chats = db.prepare(query).all(...params, limit, offset);
        const total = db.prepare(countQuery).get(...params).count;

        chats.forEach(c => {
            if (c.timestamp && !c.timestamp.endsWith('Z')) c.timestamp += 'Z';
        });

        res.json({
            success: true,
            message: 'Chat history retrieved',
            data: {
                chats,
                pagination: { total, page: Number(page), limit: Number(limit) }
            }
        });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error', error_code: 'SYS_500' });
    }
});

// EXPENSES CRUD
router.get('/expenses', authenticate, canViewAnalytics, (req, res) => {
    try {
        const { page = 1, limit = 50, category } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT e.*, u.push_name as creator_name, a.name as admin_creator
            FROM expenses e 
            LEFT JOIN users u ON e.created_by = u.id 
            LEFT JOIN admin_users a ON e.created_by = a.id
            WHERE e.deleted_at IS NULL 
        `;
        let params = [];
        if (category) {
            query += " AND e.category = ?";
            params.push(category);
        }
        
        const countQuery = "SELECT COUNT(*) as count FROM expenses WHERE deleted_at IS NULL" + (category ? " AND category = ?" : "");
        const total = db.prepare(countQuery).get(...params).count;

        query += " ORDER BY e.created_at DESC LIMIT ? OFFSET ?";
        const expenses = db.prepare(query).all(...params, limit, offset);

        expenses.forEach(e => {
            if (e.created_at && !e.created_at.endsWith('Z')) e.created_at += 'Z';
        });

        // Stats for Expense Dashboard — offset by +7h for WIB
        const monthlyCost = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE deleted_at IS NULL AND strftime('%Y-%m', created_at, '+7 hours') = strftime('%Y-%m', 'now', '+7 hours')").get().total || 0;
        const annualCost = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE deleted_at IS NULL AND strftime('%Y', created_at, '+7 hours') = strftime('%Y', 'now', '+7 hours')").get().total || 0;
        const categoryStats = db.prepare("SELECT category, SUM(amount) as total FROM expenses WHERE deleted_at IS NULL GROUP BY category").all();

        res.json({
            success: true,
            data: { 
                expenses, 
                pagination: { total, page: Number(page), limit: Number(limit) },
                stats: { monthlyCost, annualCost, categoryStats }
            }
        });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/expenses', authenticate, canManageSystem, (req, res) => {
    try {
        const { category, description, amount } = req.body;
        db.prepare("INSERT INTO expenses (category, description, amount, created_by) VALUES (?, ?, ?, ?)").run(category, description, amount, req.user.id);
        res.json({ success: true, message: 'Expense added' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/expenses/:id', authenticate, canManageSystem, (req, res) => {
    try {
        const { category, description, amount } = req.body;
        db.prepare("UPDATE expenses SET category=?, description=?, amount=? WHERE id=?").run(category, description, amount, req.params.id);
        res.json({ success: true, message: 'Expense updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/expenses/:id', authenticate, canManageSystem, (req, res) => {
    try {
        db.prepare("UPDATE expenses SET deleted_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
        res.json({ success: true, message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// AUDIT LOGS
router.get('/audit-logs', authenticate, canManageSystem, (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const logs = db.prepare(`
            SELECT a.*, u.name as admin_name 
            FROM audit_logs a 
            LEFT JOIN admin_users u ON a.admin_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT ? OFFSET ?
        `).all(limit, offset);
        
        const total = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get().count;

        // Add 'Z' suffix for consistent UTC parsing in frontend
        logs.forEach(l => {
            if (l.created_at && !l.created_at.endsWith('Z')) l.created_at += 'Z';
        });

        res.json({
            success: true,
            data: { logs, pagination: { total, page: Number(page), limit: Number(limit) } }
        });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// EXPORT ROUTES
router.get('/export/expenses', authenticate, canExportExcel, (req, res) => {
    try {
        const expenses = db.prepare("SELECT * FROM expenses WHERE deleted_at IS NULL").all();
        // Sederhana CSV
        let csv = 'ID,Category,Description,Amount,Created At\n';
        expenses.forEach(e => {
            csv += `${e.id},${e.category},"${e.description}",${e.amount},${e.created_at}\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('expenses.csv');
        return res.send(csv);
    } catch(err) {
        res.status(500).send('Server Error');
    }
});

router.get('/export/chats', authenticate, canExportExcel, (req, res) => {
    try {
        const chats = db.prepare("SELECT * FROM chat_history WHERE deleted_at IS NULL ORDER BY timestamp DESC").all();
        let csv = 'ID,User_ID,Sender,Message,Timestamp\n';
        chats.forEach(c => {
            const cleanMsg = c.message ? c.message.replace(/"/g, '""').replace(/\n/g, ' ') : '';
            csv += `${c.id},${c.user_id},${c.sender},"${cleanMsg}",${c.timestamp}\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('chat_history.csv');
        return res.send(csv);
    } catch(err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
