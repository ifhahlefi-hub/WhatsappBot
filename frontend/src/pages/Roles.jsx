import { useState, useEffect } from 'react';
import { Shield, Plus, UserPlus, X } from 'lucide-react';
import api from '../services/api';

export default function Roles() {
  const [rolesData, setRolesData] = useState({ roles: [], assignments: [] });
  const [admins, setAdmins] = useState([]);
  const [waUsers, setWaUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ user_id: '', role_id: '', isWa: true });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, adminsRes, usersRes] = await Promise.all([
        api.get('/roles'),
        api.get('/admin-users'),
        api.get('/users?limit=1000')
      ]);
      const rData = rolesRes.data?.data || rolesRes.data || rolesRes || { roles: [], assignments: [] };
      const aData = adminsRes.data?.data || adminsRes.data || adminsRes || [];
      const uData = usersRes.data?.data?.users || usersRes.data?.users || [];
      setRolesData(rData);
      setAdmins(aData);
      setWaUsers(uData);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRolesData({ roles: [], assignments: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      if (assignForm.isWa) {
        await api.post('/roles/assign-wa-user', { user_id: assignForm.user_id, role_id: assignForm.role_id });
      } else {
        await api.post('/roles/assign', { user_id: assignForm.user_id, role_id: assignForm.role_id });
      }
      setIsAssignModalOpen(false);
      setAssignForm({ user_id: '', role_id: '', isWa: true });
      fetchData();
    } catch (err) {
      alert('Failed to assign role');
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Hapus akses role ini dari admin?')) return;
    try {
      await api.delete(`/roles/assign/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to remove role');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system roles and administrator assignments.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsAssignModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <UserPlus className="h-5 w-5 mr-2" />
            Assign Role
          </button>
        </div>
      </div>

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button onClick={() => setIsAssignModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">Assign Role</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="flex gap-4 mb-2">
                <label className="flex items-center">
                  <input type="radio" checked={assignForm.isWa} onChange={() => setAssignForm({...assignForm, isWa: true, user_id: ''})} />
                  <span className="ml-2 text-sm text-gray-700">WhatsApp User</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" checked={!assignForm.isWa} onChange={() => setAssignForm({...assignForm, isWa: false, user_id: ''})} />
                  <span className="ml-2 text-sm text-gray-700">Admin User</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{assignForm.isWa ? 'WhatsApp User' : 'Admin User'}</label>
                <select 
                  required
                  value={assignForm.user_id} 
                  onChange={e => setAssignForm({...assignForm, user_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih User --</option>
                  {assignForm.isWa 
                    ? waUsers.map(u => <option key={u.id} value={u.id}>{u.push_name || 'Unknown'} ({u.whatsapp_number})</option>)
                    : admins.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  required
                  value={assignForm.role_id} 
                  onChange={e => setAssignForm({...assignForm, role_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Role --</option>
                  {rolesData.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Available Roles</h2>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{rolesData.roles.length} roles</span>
          </div>
          {isLoading ? (
            <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rolesData.roles.map(role => (
                <li key={role.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mt-1">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-900">{role.name}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{role.user_count || 0} assigned</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Assigned Admins List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">Admin Role Assignments</h2>
          </div>
          {isLoading ? (
            <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rolesData.assignments.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{a.admin_name}</div>
                        <div className="text-xs text-gray-500">{a.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold leading-4 text-indigo-800 bg-indigo-100 rounded-full">
                          {a.role_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleRemove(a.id)} className="text-red-600 hover:text-red-900 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rolesData.assignments.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">
                        No roles assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
