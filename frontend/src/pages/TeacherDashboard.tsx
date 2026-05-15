import { useEffect, useState } from 'react';
import { BookOpen, CalendarCheck, Users } from 'lucide-react';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import type { Subject } from '../types';

export default function TeacherDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    api.get('/subjects').then((res) => setSubjects(res.data.data));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
        <p className="text-slate-400">Manage your subjects and students</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="My Subjects" value={subjects.length} icon={BookOpen} />
        <StatCard
          title="Total Students"
          value={subjects.reduce((s, sub) => s + ((sub as Subject & { studentIds?: unknown[] }).studentIds?.length ?? 0), 0)}
          icon={Users}
          color="bg-violet-600"
        />
        <StatCard title="Today's Tasks" value="Mark Attendance" icon={CalendarCheck} color="bg-emerald-600" />
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Your Subjects</h3>
        <div className="space-y-3">
          {subjects.map((s) => (
            <div key={s._id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg">
              <div>
                <p className="font-medium text-white">{s.name}</p>
                <p className="text-sm text-slate-400">{s.code} · {s.department}</p>
              </div>
              <span className="text-sm text-primary-400">{s.credits} credits</span>
            </div>
          ))}
          {subjects.length === 0 && <p className="text-slate-500">No subjects assigned</p>}
        </div>
      </div>
    </div>
  );
}
