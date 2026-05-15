import { Router } from 'express';
import { body, param } from 'express-validator';
import * as subjectController from '../controllers/subjectController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('admin'),
  validate([
    body('code').notEmpty(),
    body('name').notEmpty(),
    body('credits').isInt({ min: 1 }),
    body('department').notEmpty(),
    body('teacherId').isMongoId(),
  ]),
  subjectController.createSubject
);

router.get('/', subjectController.getSubjects);
router.get('/:id', validate([param('id').isMongoId()]), subjectController.getSubject);
router.put('/:id', authorize('admin'), validate([param('id').isMongoId()]), subjectController.updateSubject);
router.patch('/:id/teacher', authorize('admin'), subjectController.assignTeacher);
router.patch('/:id/students', authorize('admin', 'teacher'), subjectController.assignStudents);
router.delete('/:id', authorize('admin'), subjectController.deleteSubject);

export default router;
