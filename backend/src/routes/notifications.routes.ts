import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';

const router = Router();

router.get('/', authenticate, notificationsController.list);
router.patch('/:id/read', authenticate, notificationsController.markRead);
router.patch('/read-all', authenticate, notificationsController.markAllRead);

export default router;
