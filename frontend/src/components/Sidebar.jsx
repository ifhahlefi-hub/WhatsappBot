import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Receipt, Activity, Settings, Shield } from 'lucide-react';
import useAuthStore from '../store/authStore';
import ChangePasswordModal from './ChangePasswordModal';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['Super Admin', 'Admin', 'Operator', 'Moderator'] },
  { path: '/users', icon: Users, label: 'Pengguna', roles: ['Super Admin', 'Admin', 'Operator', 'Moderator'] },
  { path: '/chats', icon: MessageSquare, label: 'Chat History', roles: ['Super Admin'] },
  { path: '/expenses', icon: Receipt, label: 'Pengeluaran', roles: ['Super Admin', 'Admin', 'Operator'] },
  { path: '/roles', icon: Shield, label: 'Role Management', roles: ['Super Admin'] },
  { path: '/system', icon: Activity, label: 'System & Audit', roles: ['Super Admin'] },
];

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Bot Admin
        </h1>
      </div>
      
      <div className="p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
          Menu Utama
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            if (!item.roles.includes(user?.role)) return null;
            
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-100 relative">
        <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center group">
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</div>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {user?.role}
            </div>
          </div>
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            title="Ganti Password"
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
}
