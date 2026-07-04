import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity, ShieldAlert, Key, LogIn, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatTanggalJamLengkap } from '../utils/formatTime';
import api from '../services/api';

const getActionIcon = (action) => {
  if (action.toLowerCase().includes('login')) return <LogIn className="h-5 w-5 text-blue-500" />;
  if (action.toLowerCase().includes('password')) return <Key className="h-5 w-5 text-purple-500" />;
  if (action.toLowerCase().includes('setting') || action.toLowerCase().includes('config')) return <Settings className="h-5 w-5 text-gray-500" />;
  return <ShieldAlert className="h-5 w-5 text-orange-500" />;
};

const getModuleColor = (module) => {
  switch (module.toLowerCase()) {
    case 'auth': return 'bg-blue-100 text-blue-800';
    case 'system': return 'bg-red-100 text-red-800';
    case 'users': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function SystemActivity() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 20;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/audit-logs', { params: { page, limit } });
      const data = res.data?.data || res.data || res || {};
      setLogs(data.logs || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / limit) || 1);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System & Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Lacak semua aktivitas admin dan perubahan sistem keamanan.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktivitas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Module</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Memuat log sistem...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <Activity className="h-12 w-12 text-gray-300 mb-3" />
                    Belum ada log aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-sm text-gray-500 break-words max-w-sm">{log.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getModuleColor(log.module)}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{log.admin_name || `Admin ID: ${log.admin_id}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div title={formatTanggalJamLengkap(log.created_at)}>
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Halaman <span className="font-medium text-gray-900">{page}</span> dari <span className="font-medium text-gray-900">{totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
