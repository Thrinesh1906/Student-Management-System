import { Router } from 'express';
import { body } from 'express-validator';
import * as enrollmentController from '../controllers/enrollmentController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('admin', 'teacher'),
  validate([body('studentId').isMongoId(), body('subjectId').isMongoId()]),
  enrollmentController.enroll
);

router.get('/', enrollmentController.getEnrollments);
router.get('/:id/history', enrollmentController.getEnrollmentHistory);
router.delete('/:id', authorize('admin', 'teacher'), enrollmentController.removeEnrollment);

export default router;
