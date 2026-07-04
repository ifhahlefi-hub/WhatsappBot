import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MessageSquare, Zap, Clock, Phone, Terminal, Bot, X } from 'lucide-react';
import { formatJam, formatTanggal, formatTanggalJam } from '../utils/formatTime';
import api from '../services/api';

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    const fetchUserAndRoles = async () => {
      try {
        const [res, rolesRes] = await Promise.all([
           api.get(`/users/${id}`),
           api.get('/roles')
        ]);
        setUser(res.data?.data || res.data || res);
        setRoles(rolesRes.data?.data?.roles || rolesRes.data?.roles || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndRoles();
  }, [id]);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      await api.post('/roles/assign-wa-user', { user_id: user.id, role_id: selectedRole === 'NULL' ? null : selectedRole });
      setIsRoleModalOpen(false);
      
      // Refresh user
      const res = await api.get(`/users/${id}`);
      setUser(res.data?.data || res.data || res);
    } catch(err) {
      alert('Gagal mengubah role');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-gray-500 text-center mt-10">User not found</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center space-x-4">
        <Link to="/users" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          {user.profile_picture ? (
            <img src={user.profile_picture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User className="h-12 w-12" />
            </div>
          )}
          <h2 className="mt-4 text-xl font-bold text-gray-900">{user.push_name || 'Unknown'}</h2>
          <p className="text-gray-500 flex items-center mt-1"><Phone className="h-4 w-4 mr-1"/> {user.whatsapp_number}</p>
          <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
            <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {user.status || 'Aktif'}
            </span>
            {user.role_name && (
              <span className="inline-flex px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                {user.role_name}
              </span>
            )}
          </div>
          <button onClick={() => { setSelectedRole(user.role_id || ''); setIsRoleModalOpen(true); }} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">Ubah Role</button>
          
          <p className="mt-4 text-sm text-gray-500">First Seen: <span className="font-semibold text-gray-700">{user.created_at ? formatTanggal(user.created_at) : '-'}</span></p>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mr-3">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Messages</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{user.total_in + user.total_out}</h3>
            <p className="text-xs text-gray-500 mt-1">{user.total_in} In / {user.total_out} Out</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mr-3">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">AI Tokens</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{(user.sum_tokens || 0).toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Total token used</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mr-3">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Last Active</p>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{user.last_active ? formatTanggal(user.last_active) : '-'}</h3>
            <p className="text-xs text-gray-500 mt-1">{user.last_active ? formatJam(user.last_active) : '-'}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center mr-3">
                <Terminal className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Fav Command</p>
            </div>
            <h3 className="text-lg font-bold text-indigo-600 font-mono truncate">{user.favorite_command || '-'}</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center mr-3">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Active Hour</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{user.favorite_hour ? `${user.favorite_hour}:00` : '-'}</h3>
            <p className="text-xs text-gray-500 mt-1">Most frequent chat time</p>
          </div>

        </div>
      </div>

      {/* Recent Conversation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Recent Conversation</h3>
          <p className="text-xs text-gray-500">Last 20 messages</p>
        </div>
        <div className="p-6 bg-[#efeae2] max-h-[600px] overflow-y-auto" style={{ backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')", backgroundSize: '400px' }}>
          <div className="space-y-4 flex flex-col-reverse">
            {user.recent_chats && user.recent_chats.length > 0 ? user.recent_chats.map((chat) => {
              const isBot = chat.sender === 'bot' || chat.sender === 'system';
              return (
                <div key={chat.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 shadow-sm relative ${
                    isBot ? 'bg-white rounded-tl-none' : 'bg-[#d9fdd3] rounded-tr-none'
                  }`}>
                    {isBot && <div className="text-xs font-bold text-blue-500 mb-1 flex items-center"><Bot className="h-3 w-3 mr-1"/> Bot {chat.ai_model ? `(${chat.ai_model})` : ''}</div>}
                    <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">{chat.message}</div>
                    <div className="text-[10px] text-gray-400 mt-1 text-right flex justify-between items-center">
                       {chat.total_tokens ? <span className="text-amber-500 mr-2">{chat.total_tokens} tkns</span> : <span></span>}
                      {formatJam(chat.timestamp)}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex justify-center mt-10">
                <span className="bg-white/90 text-gray-500 text-sm px-4 py-2 rounded-lg shadow-sm">Belum ada percakapan.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsRoleModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">Ubah Role WhatsApp User</h2>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Baru</label>
                <select 
                  required
                  value={selectedRole} 
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Role --</option>
                  <option value="NULL">Tidak Ada Role</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
