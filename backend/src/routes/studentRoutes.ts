import { Router } from 'express';
import { body, param } from 'express-validator';
import * as studentController from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('admin'),
  validate([
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('studentId').notEmpty(),
    body('department').notEmpty(),
    body('year').isInt({ min: 1, max: 6 }),
    body('semester').isInt({ min: 1, max: 12 }),
  ]),
  studentController.createStudent
);

router.get('/me', authorize('student'), studentController.getMyProfile);
router.get('/', authorize('admin', 'teacher'), studentController.getStudents);
router.get('/:id', authorize('admin', 'teacher', 'student'), studentController.getStudent);
router.put('/:id', authorize('admin'), validate([param('id').isMongoId()]), studentController.updateStudent);
router.delete('/:id', authorize('admin'), validate([param('id').isMongoId()]), studentController.deleteStudent);

export default router;
