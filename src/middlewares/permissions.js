function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke fitur ini',
        error_code: 'AUTH_004'
      });
    }

    next();
  };
}

const canExportExcel = requireRole('Super Admin', 'Admin');
const canExportCSV = requireRole('Super Admin', 'Admin');
const canExportPdf = requireRole('Super Admin', 'Admin');
const canManageRoles = requireRole('Super Admin');
const canManageUsers = requireRole('Super Admin', 'Admin', 'Moderator');
const canViewAudit = requireRole('Super Admin');
const canViewChats = requireRole('Super Admin', 'Admin', 'Operator', 'Moderator');
const canManageExpenses = requireRole('Super Admin', 'Admin');
const canViewChatHistory = requireRole('Super Admin');
const canViewAnalytics = requireRole('Super Admin', 'Admin', 'Operator');
const canViewUsers = requireRole('Super Admin', 'Admin', 'Operator', 'Moderator');
const canManageSystem = requireRole('Super Admin');

module.exports = {
  requireRole,
  canExportExcel,
  canExportCSV,
  canExportPdf,
  canManageRoles,
  canManageUsers,
  canViewAudit,
  canViewChats,
  canManageExpenses,
  canViewChatHistory,
  canViewAnalytics,
  canViewUsers,
  canManageSystem
};
