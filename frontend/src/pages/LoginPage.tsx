import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@sms.local');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated()) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-primary-900/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-primary-600 rounded-2xl mb-4">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Student Management System</h1>
          <p className="text-slate-400 mt-2">DevOps-Driven Education Platform</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
          <p className="text-xs text-slate-500 text-center">Demo: admin@sms.local / Admin@123</p>
        </form>
      </div>
    </div>
  );
}
