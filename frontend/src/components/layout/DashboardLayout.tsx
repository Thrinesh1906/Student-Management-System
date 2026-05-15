import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Award,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'teacher', 'student'] },
  { to: '/students', icon: Users, label: 'Students', roles: ['admin', 'teacher'] },
  { to: '/subjects', icon: BookOpen, label: 'Subjects', roles: ['admin', 'teacher', 'student'] },
  { to: '/enrollments', icon: ClipboardList, label: 'Enrollments', roles: ['admin', 'teacher'] },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance', roles: ['admin', 'teacher'] },
  { to: '/marks', icon: Award, label: 'Marks', roles: ['admin', 'teacher', 'student'] },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-950">
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">SMS</h1>
              <p className="text-xs text-slate-400">Student Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
