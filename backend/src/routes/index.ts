import { Router } from 'express';
import authRoutes from './authRoutes';
import studentRoutes from './studentRoutes';
import subjectRoutes from './subjectRoutes';
import enrollmentRoutes from './enrollmentRoutes';
import attendanceRoutes from './attendanceRoutes';
import marksRoutes from './marksRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/subjects', subjectRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/marks', marksRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
