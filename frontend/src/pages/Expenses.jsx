import { useState, useEffect } from 'react';
import { Download, Plus, Receipt } from 'lucide-react';
import { formatTanggal } from '../utils/formatTime';
import api from '../services/api';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(num || 0);
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ monthlyCost: 0, annualCost: 0, categoryStats: [] });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50 });
  const [isLoading, setIsLoading] = useState(true);
  
  // State for form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ category: 'Server', description: '', amount: '' });
  
  const categories = ['Server', 'API', 'OpenAI', 'Gemini', 'Anthropic', 'Hosting', 'Domain', 'Other'];

  const fetchExpenses = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get('/expenses', { params: { page, limit: 50 } });
      const data = res.data?.data || res.data || res || {};
      setExpenses(data.expenses || []);
      setStats(data.stats || { monthlyCost: 0, annualCost: 0, categoryStats: [] });
      setPagination(data.pagination || { total: 0, page: 1, limit: 50 });
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setIsFormOpen(false);
      setFormData({ category: 'Server', description: '', amount: '' });
      fetchExpenses();
    } catch (err) {
      alert('Gagal menyimpan expense');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus expense ini?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert('Gagal menghapus expense');
    }
  };

  const handleExport = async (type) => {
    try {
      const endpoint = type === 'excel' ? '/export/excel' : '/export/expenses';
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Export gagal');
      }
      const blob = await response.blob();
      const filename = type === 'excel' ? 'expenses.xlsx' : 'expenses.csv';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Gagal melakukan export: ' + (err.message || 'Server error'));
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola pengeluaran operasional bot.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button onClick={() => handleExport('csv')} className="flex-1 sm:flex-none bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center font-medium hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </button>
          <button onClick={() => handleExport('excel')} className="flex-1 sm:flex-none bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg flex items-center justify-center font-medium hover:bg-green-100 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </button>
          <button onClick={() => setIsFormOpen(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Monthly Cost</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatRupiah(stats.monthlyCost)}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Annual Cost</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatRupiah(stats.annualCost)}</h3>
        </div>
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500 mb-2">Cost By Category</p>
          <div className="flex flex-wrap gap-2">
            {stats.categoryStats && stats.categoryStats.length > 0 ? stats.categoryStats.map(c => (
              <span key={c.category} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {c.category}: {formatRupiah(c.total)}
              </span>
            )) : <span className="text-xs text-gray-400">Belum ada data pengeluaran</span>}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Add New Expense</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input 
                type="text" 
                required
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Misal: Perpanjang Domain"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (IDR)</label>
              <input 
                type="number" 
                required
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
            </div>
            <div className="md:col-span-4 flex justify-end space-x-3 mt-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Oleh</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTanggal(expense.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-lg">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.admin_creator || expense.creator_name || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {formatRupiah(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                      Tidak ada catatan pengeluaran
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {!isLoading && expenses.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <div>
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} hingga {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} pengeluaran
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => fetchExpenses(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => fetchExpenses(pagination.page + 1)}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
