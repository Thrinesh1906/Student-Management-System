import { useEffect, useState } from 'react';
import api from '../api/client';

interface Mark {
  _id: string;
  type: string;
  title: string;
  score: number;
  maxScore: number;
  published: boolean;
  subjectId: { name: string; code: string };
  studentId: { userId?: { firstName: string; lastName: string } };
}

export default function MarksPage() {
  const [marks, setMarks] = useState<Mark[]>([]);

  useEffect(() => {
    api.get('/marks').then((res) => setMarks(res.data.data));
  }, []);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Marks</h1>
        <p className="text-slate-400">Grades and performance records</p>
      </header>
      <section className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
              <th className="pb-3">Student</th>
              <th className="pb-3">Subject</th>
              <th className="pb-3">Assessment</th>
              <th className="pb-3">Score</th>
              <th className="pb-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {marks.map((m) => (
              <tr key={m._id} className="border-b border-slate-800">
                <td className="py-3 text-white">
                  {m.studentId?.userId?.firstName} {m.studentId?.userId?.lastName}
                </td>
                <td className="py-3 text-slate-300">{m.subjectId?.name}</td>
                <td className="py-3 text-slate-300">{m.title}</td>
                <td className="py-3 text-primary-400">
                  {m.score}/{m.maxScore}
                </td>
                <td className="py-3">
                  <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">{m.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
