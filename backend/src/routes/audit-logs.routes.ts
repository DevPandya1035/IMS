import { Router } from 'express';
import { auditLogsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';

const router = Router();

router.get('/', authenticate, hasPermission('VIEW_AUDIT_LOGS'), auditLogsController.list);

export default router;
