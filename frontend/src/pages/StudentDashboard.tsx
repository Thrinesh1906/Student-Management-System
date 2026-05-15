import { useEffect, useState } from 'react';
import { Award, CalendarCheck, BookOpen } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';

export default function StudentDashboard() {
  const [performance, setPerformance] = useState<{
    gpa: number;
    overallPercentage: number;
    subjects: { subjectName: string; percentage: number }[];
  } | null>(null);
  const [attendance, setAttendance] = useState<{ percentage: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await api.get('/students/me');
        const student = profile.data.data;
        if (student) {
          const [perf, att] = await Promise.all([
            api.get(`/marks/performance/${student._id}`),
            api.get('/attendance/analytics', { params: { studentId: student._id } }),
          ]);
          setPerformance(perf.data.data);
          setAttendance(att.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const avgAttendance =
    attendance.length > 0
      ? Math.round(attendance.reduce((s, a) => s + a.percentage, 0) / attendance.length)
      : 0;

  const chartData = [{ name: 'GPA', value: (performance?.gpa ?? 0) * 10, fill: '#3b82f6' }];

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
        <p className="text-slate-400">Your academic performance overview</p>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="GPA" value={performance?.gpa?.toFixed(2) ?? '-'} icon={Award} />
        <StatCard title="Overall %" value={`${performance?.overallPercentage ?? 0}%`} icon={BookOpen} color="bg-violet-600" />
        <StatCard title="Attendance" value={`${avgAttendance}%`} icon={CalendarCheck} color="bg-emerald-600" />
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="card flex flex-col items-center">
          <h3 className="text-lg font-semibold text-white mb-4">GPA Score</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={chartData} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-3xl font-bold text-primary-400">{performance?.gpa?.toFixed(2) ?? '0.00'}</p>
        </article>
        <article className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Subject Performance</h3>
          <ul className="space-y-3">
            {performance?.subjects?.length ? (
              performance.subjects.map((s) => (
                <li key={s.subjectName} className="flex justify-between items-center">
                  <span className="text-slate-300">{s.subjectName}</span>
                  <span className="flex items-center gap-3">
                    <span className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden inline-block">
                      <span className="block h-full bg-primary-500 rounded-full" style={{ width: `${s.percentage}%` }} />
                    </span>
                    <span className="text-sm text-slate-400 w-12">{s.percentage}%</span>
                  </span>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No marks published yet</li>
            )}
          </ul>
        </article>
      </section>
    </>
  );
}
