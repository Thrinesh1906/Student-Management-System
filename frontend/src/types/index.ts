export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Student {
  _id: string;
  studentId: string;
  department: string;
  year: number;
  semester: number;
  userId: User & { _id?: string };
}

export interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  teacherId: User;
}

export interface DashboardStats {
  counts: { students: number; teachers: number; subjects: number; enrollments: number };
  attendanceTrend: { date: string; percentage: number }[];
  departmentStats: { department: string; count: number }[];
  performanceDistribution: { _id: number; count: number }[];
}
