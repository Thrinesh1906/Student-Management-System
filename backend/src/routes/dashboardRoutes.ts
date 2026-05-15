import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, authorize('admin', 'teacher'), dashboardController.getDashboardStats);

export default router;
