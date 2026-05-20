import { Router } from 'express';
import { body } from 'express-validator';
import * as marksController from '../controllers/marksController';
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
    body('type').isIn(['internal', 'exam']),
    body('title').notEmpty(),
    body('score').isFloat({ min: 0 }),
    body('maxScore').isFloat({ min: 1 }),
  ]),
  marksController.addMark
);

router.get('/', marksController.getMarks);
router.put('/:id', authorize('admin', 'teacher'), marksController.updateMark);
router.post('/publish', authorize('admin', 'teacher'), marksController.publishMarks);
router.get('/performance/:studentId', marksController.getStudentPerformance);
router.get('/analytics/:subjectId', authorize('admin', 'teacher'), marksController.getSubjectAnalytics);

export default router;
