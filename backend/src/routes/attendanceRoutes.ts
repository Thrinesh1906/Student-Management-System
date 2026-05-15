import { Router } from 'express';
import { body } from 'express-validator';
import * as attendanceController from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('admin', 'teacher'),
  validate([
    body('studentId').isMongoId(),
    body('subjectId').isMongoId(),
    body('date').isISO8601(),
    body('status').isIn(['present', 'absent', 'late', 'excused']),
  ]),
  attendanceController.markAttendance
);

router.post('/bulk', authorize('admin', 'teacher'), attendanceController.bulkMarkAttendance);
router.get('/', attendanceController.getAttendance);
router.get('/analytics', attendanceController.getAttendanceAnalytics);
router.get('/export', authorize('admin', 'teacher'), attendanceController.exportAttendanceReport);
router.post('/alerts', authorize('admin'), attendanceController.checkLowAttendance);

export default router;
