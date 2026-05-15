import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentsPage from './pages/StudentsPage';
import SubjectsPage from './pages/SubjectsPage';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import EnrollmentsPage from './pages/EnrollmentsPage';

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function DashboardRouter() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  return <StudentDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardRouter />} />
        <Route
          path="students"
          element={
            <PrivateRoute roles={['admin', 'teacher']}>
              <StudentsPage />
            </PrivateRoute>
          }
        />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route
          path="enrollments"
          element={
            <PrivateRoute roles={['admin', 'teacher']}>
              <EnrollmentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <PrivateRoute roles={['admin', 'teacher']}>
              <AttendancePage />
            </PrivateRoute>
          }
        />
        <Route path="marks" element={<MarksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
