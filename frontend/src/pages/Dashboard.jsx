import { useState, useEffect } from 'react';
import { Users, Activity, MessageSquare, Zap, TrendingUp, DollarSign, Command, Cpu, Clock, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(num || 0);
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toLocaleString();
}

function StatCard({ title, value, icon: Icon, subtitle, colorClass, bgColorClass }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bgColorClass}`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
      </div>
      {subtitle && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-gray-700 text-sm">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="font-semibold">
            {entry.name === 'count' ? 'Total' : entry.name}: <span style={{ color: entry.color }}>{entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      const statsData = res.data?.data || res.data || res;
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const providerData = (stats?.providerStats || []).map(p => ({
    name: p.provider,
    value: p.tokens || 0
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Enterprise Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time operational metrics & AI analytics</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Auto-refresh 1 menit</span>
        </div>
      </div>

      {/* Stat Cards — original clean white design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          subtitle={<><span className="text-blue-600 font-medium mr-1">+{stats?.newUsers?.today || 0}</span> new today, <span className="text-blue-600 font-medium mx-1">+{stats?.newUsers?.month || 0}</span> this month</>}
          colorClass="text-blue-600" bgColorClass="bg-blue-50"
        />
        <StatCard 
          title="Active Users" 
          value={stats?.activeUsers?.['24h'] || 0} 
          icon={Activity} 
          subtitle={<><span className="text-green-600 font-medium mr-1">{stats?.activeUsers?.['1h'] || 0}</span> active in 1h, <span className="text-green-600 font-medium mx-1">{stats?.activeUsers?.['5m'] || 0}</span> in 5m</>}
          colorClass="text-green-600" bgColorClass="bg-green-50"
        />
        <StatCard 
          title="Messages Today" 
          value={stats?.messages?.totalToday || 0} 
          icon={MessageSquare} 
          subtitle={<><span className="text-purple-600 font-medium mr-1">{stats?.messages?.inToday || 0}</span> in, <span className="text-purple-600 font-medium mx-1">{stats?.messages?.outToday || 0}</span> out</>}
          colorClass="text-purple-600" bgColorClass="bg-purple-50"
        />
        <StatCard 
          title="AI Token Usage" 
          value={formatNumber(stats?.aiUsage?.today?.total || 0)} 
          icon={Zap} 
          subtitle={<><span className="text-amber-600 font-medium mr-1">{formatNumber(stats?.aiUsage?.month?.total || 0)}</span> tokens this month</>}
          colorClass="text-amber-600" bgColorClass="bg-amber-50"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Message Trend — Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Message Trend (30 Days)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Daily inbound & outbound message volume</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.messageTrend || []}>
                <defs>
                  <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" axisLine={false} tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11}} dy={8}
                  tickFormatter={v => v ? v.slice(5) : ''}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" dataKey="count" 
                  stroke="#6366f1" strokeWidth={2.5} 
                  fill="url(#msgGradient)"
                  dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Active Users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Top Active Users</h3>
              <p className="text-xs text-gray-400 mt-0.5">Ranked by message count</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1.5">
            {stats?.topUsers?.length > 0 ? stats.topUsers.slice(0, 6).map((user, idx) => {
              const maxCount = stats.topUsers[0]?.msg_count || 1;
              const pct = Math.round((user.msg_count / maxCount) * 100);
              const rankColors = ['bg-amber-400', 'bg-gray-400', 'bg-orange-400'];
              return (
                <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${idx < 3 ? rankColors[idx] : 'bg-gray-200 !text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.push_name || 'Unknown'}</p>
                    <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 tabular-nums">{user.msg_count}</span>
                </div>
              );
            }) : (
              <div className="text-center text-gray-400 text-sm py-8">Belum ada data</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User Growth */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">User Growth</h3>
              <p className="text-xs text-gray-400 mt-0.5">New registrations in 30 days</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.userGrowth || []}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" axisLine={false} tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} dy={8}
                  tickFormatter={v => v ? v.slice(5) : ''}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Costs & Expenses */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">AI Costs & Expenses</h3>
              <p className="text-xs text-gray-400 mt-0.5">Operational cost summary</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-rose-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Expenses Today</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">{formatRupiah(stats?.expenses?.today)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Expenses This Month</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">{formatRupiah(stats?.expenses?.month)}</p>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">AI Tokens by Provider</p>
              {providerData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={providerData} dataKey="value" cx="50%" cy="50%" 
                          innerRadius={22} outerRadius={36} strokeWidth={2} stroke="#fff"
                        >
                          {providerData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {providerData.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {p.name}
                        </span>
                        <span className="font-bold text-gray-800 tabular-nums">{p.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-3">No provider data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Most Expensive Users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Most Expensive Users</h3>
              <p className="text-xs text-gray-400 mt-0.5">Highest AI token consumers</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="space-y-1.5">
            {stats?.expensiveUsers?.length > 0 ? stats.expensiveUsers.filter(u => u.total_tokens > 0).slice(0, 6).map((user, idx) => {
              const maxTokens = stats.expensiveUsers.filter(u => u.total_tokens > 0)[0]?.total_tokens || 1;
              const pct = Math.round(((user.total_tokens || 0) / maxTokens) * 100);
              return (
                <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 text-sm font-bold">
                    {(user.push_name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.push_name || 'Unknown'}</p>
                    <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 tabular-nums">{formatNumber(user.total_tokens || 0)}</span>
                </div>
              );
            }) : (
              <div className="text-center text-gray-400 text-sm py-8">Belum ada data</div>
            )}
            {stats?.expensiveUsers?.length > 0 && stats.expensiveUsers.filter(u => u.total_tokens > 0).length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">Belum ada penggunaan token</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Commands */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Top Bot Commands</h3>
            <p className="text-xs text-gray-400 mt-0.5">Most frequently used commands</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <Command className="h-4 w-4 text-slate-600" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {stats?.topCommands?.length > 0 ? stats.topCommands.map((cmd, idx) => {
            const maxUses = stats.topCommands[0]?.count || 1;
            const intensity = Math.max(0.05, (cmd.count / maxUses));
            return (
              <div 
                key={idx} 
                className="relative overflow-hidden rounded-xl p-4 border border-gray-100 bg-gradient-to-br from-indigo-50/80 to-white hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
              >
                <div 
                  className="absolute inset-0 bg-indigo-500/5 rounded-xl"
                  style={{ opacity: intensity }}
                />
                <span className="relative font-mono text-sm font-bold text-indigo-700 truncate block mb-2 group-hover:text-indigo-800">
                  {cmd.message}
                </span>
                <div className="relative flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500">{cmd.count} uses</span>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full text-center text-gray-400 text-sm py-8">Belum ada data command</div>
          )}
        </div>
      </div>
    </div>
  );
}
