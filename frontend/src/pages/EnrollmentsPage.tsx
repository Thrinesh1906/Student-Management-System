import { useEffect, useState } from 'react';
import api from '../api/client';

interface Enrollment {
  _id: string;
  status: string;
  enrolledAt: string;
  studentId: { userId?: { firstName: string; lastName: string }; studentId: string };
  subjectId: { name: string; code: string };
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    api.get('/enrollments').then((res) => setEnrollments(res.data.data));
  }, []);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Enrollments</h1>
        <p className="text-slate-400">Student course enrollments</p>
      </header>
      <section className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
              <th className="pb-3">Student</th>
              <th className="pb-3">Subject</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e._id} className="border-b border-slate-800">
                <td className="py-3 text-white">
                  {e.studentId?.userId?.firstName} {e.studentId?.userId?.lastName}
                </td>
                <td className="py-3 text-slate-300">
                  {e.subjectId?.code} - {e.subjectId?.name}
                </td>
                <td className="py-3">
                  <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400">{e.status}</span>
                </td>
                <td className="py-3 text-slate-400">{new Date(e.enrolledAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
