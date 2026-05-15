import { useEffect, useState } from 'react';
import { Users, BookOpen, ClipboardList, UserCheck } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import type { DashboardStats } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400">System overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Students" value={stats?.counts.students ?? 0} icon={Users} />
        <StatCard title="Teachers" value={stats?.counts.teachers ?? 0} icon={UserCheck} color="bg-violet-600" />
        <StatCard title="Subjects" value={stats?.counts.subjects ?? 0} icon={BookOpen} color="bg-cyan-600" />
        <StatCard
          title="Enrollments"
          value={stats?.counts.enrollments ?? 0}
          icon={ClipboardList}
          color="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Attendance Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats?.attendanceTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Students by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats?.departmentStats ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="department" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card max-w-md">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={stats?.performanceDistribution ?? []}
              dataKey="count"
              nameKey="_id"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ _id, count }) => `${_id}%: ${count}`}
            >
              {(stats?.performanceDistribution ?? []).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
