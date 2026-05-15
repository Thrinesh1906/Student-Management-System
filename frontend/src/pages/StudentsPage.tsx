import { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import api from '../api/client';
import type { Student } from '../types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: 'Student@123',
    firstName: '',
    lastName: '',
    studentId: '',
    department: 'Computer Science',
    year: 1,
    semester: 1,
  });

  const load = () => {
    api.get('/students', { params: { search: search || undefined } }).then((res) => setStudents(res.data.data));
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/students', form);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this student?')) {
      await api.delete(`/students/${id}`);
      load();
    }
  };

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-slate-400">Manage student records</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid grid-cols-2 gap-4">
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
          <input className="input" placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <input className="input" placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <input className="input" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <button type="submit" className="btn-primary col-span-2">Create Student</button>
        </form>
      )}

      <section className="card">
        <span className="relative mb-4 block">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input className="input pl-10" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </span>
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
              <th className="pb-3">ID</th>
              <th className="pb-3">Name</th>
              <th className="pb-3">Department</th>
              <th className="pb-3">Year</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="border-b border-slate-800">
                <td className="py-3 text-primary-400">{s.studentId}</td>
                <td className="py-3 text-white">
                  {s.userId?.firstName} {s.userId?.lastName}
                </td>
                <td className="py-3 text-slate-300">{s.department}</td>
                <td className="py-3 text-slate-300">{s.year}</td>
                <td className="py-3">
                  <button onClick={() => handleDelete(s._id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
