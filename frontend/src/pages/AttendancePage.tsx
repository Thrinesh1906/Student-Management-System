import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../api/client';

export default function AttendancePage() {
  const [analytics, setAnalytics] = useState<{ percentage: number; studentId: string; subjectId: string }[]>([]);

  useEffect(() => {
    api.get('/attendance/analytics').then((res) => setAnalytics(res.data.data));
  }, []);

  const exportReport = () => {
    window.open('/api/v1/attendance/export?subjectId=', '_blank');
  };

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-slate-400">Track and analyze attendance</p>
        </div>
        <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analytics.map((a, i) => (
          <article key={i} className="card text-center">
            <p className="text-4xl font-bold text-primary-400">{a.percentage}%</p>
            <p className="text-sm text-slate-400 mt-2">Attendance Rate</p>
          </article>
        ))}
        {analytics.length === 0 && <p className="text-slate-500 col-span-3">No attendance data yet</p>}
      </section>
    </>
  );
}
