import { Router } from 'express';
import { invoicesController, paymentsController } from '../controllers/invoices.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { paymentSchema } from '../validators/sales-order.validator.js';

const router = Router();

// Payments (must be before /:id to avoid matching "payments" as an id)
router.get('/payments', authenticate, hasPermission('VIEW_INVOICE'), paymentsController.list);
router.post(
  '/payments',
  authenticate,
  hasPermission('PAY_SO'),
  validate(paymentSchema),
  auditLog('Payment'),
  paymentsController.create
);

// Invoices
router.get('/', authenticate, hasPermission('VIEW_INVOICE'), invoicesController.list);
router.get('/:id', authenticate, hasPermission('VIEW_INVOICE'), invoicesController.getById);
router.patch(
  '/:id/status',
  authenticate,
  hasPermission('SEND_INVOICE'),
  auditLog('Invoice'),
  invoicesController.updateStatus
);

export default router;
