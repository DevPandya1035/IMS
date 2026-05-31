import { Router } from 'express';
import { customersController } from '../controllers/invoices.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/sales-order.validator.js';

const router = Router();

router.get('/', authenticate, hasPermission('CREATE_SO'), customersController.list);
router.get('/:id', authenticate, hasPermission('CREATE_SO'), customersController.getById);
router.post(
  '/',
  authenticate,
  hasPermission('CREATE_SO'),
  validate(createCustomerSchema),
  auditLog('Customer'),
  customersController.create
);
router.put(
  '/:id',
  authenticate,
  hasPermission('CREATE_SO'),
  validate(updateCustomerSchema),
  auditLog('Customer'),
  customersController.update
);
router.delete(
  '/:id',
  authenticate,
  hasPermission('CREATE_SO'),
  auditLog('Customer'),
  customersController.delete
);

export default router;
