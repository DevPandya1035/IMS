import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';

const router = Router();

router.get('/dashboard', authenticate, hasPermission('VIEW_REPORTS'), analyticsController.dashboard);
router.get('/trends', authenticate, hasPermission('VIEW_REPORTS'), analyticsController.salesTrends);
router.get('/valuation', authenticate, hasPermission('VIEW_REPORTS'), analyticsController.inventoryValuation);
router.get('/forecast', authenticate, hasPermission('VIEW_FORECAST'), analyticsController.forecast);

export default router;
