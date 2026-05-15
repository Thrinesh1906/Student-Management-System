import { useEffect, useState } from 'react';
import api from '../api/client';
import type { Subject } from '../types';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    api.get('/subjects').then((res) => setSubjects(res.data.data));
  }, []);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Subjects</h1>
        <p className="text-slate-400">Course catalog and assignments</p>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((s) => (
          <article key={s._id} className="card">
            <span className="text-xs font-mono text-primary-400">{s.code}</span>
            <h3 className="text-lg font-semibold text-white mt-1">{s.name}</h3>
            <p className="text-sm text-slate-400 mt-2">{s.department}</p>
            <p className="text-sm text-slate-500 mt-4">
              Teacher: {s.teacherId?.firstName} {s.teacherId?.lastName}
            </p>
            <p className="text-sm text-slate-500">{s.credits} credits</p>
          </article>
        ))}
      </section>
    </>
  );
}
