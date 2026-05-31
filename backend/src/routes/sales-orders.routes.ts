import { Router } from 'express';
import { salesOrdersController } from '../controllers/sales-orders.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { createSalesOrderSchema, updateSalesOrderSchema } from '../validators/sales-order.validator.js';

const router = Router();

router.get('/', authenticate, hasPermission('CREATE_SO'), salesOrdersController.list);
router.get('/:id', authenticate, hasPermission('CREATE_SO'), salesOrdersController.getById);
router.post(
  '/',
  authenticate,
  hasPermission('CREATE_SO'),
  validate(createSalesOrderSchema),
  auditLog('SalesOrder'),
  salesOrdersController.create
);
router.put(
  '/:id',
  authenticate,
  hasPermission('CREATE_SO'),
  validate(updateSalesOrderSchema),
  auditLog('SalesOrder'),
  salesOrdersController.update
);
router.delete(
  '/:id',
  authenticate,
  hasPermission('CREATE_SO'),
  auditLog('SalesOrder'),
  salesOrdersController.delete
);
router.patch(
  '/:id/confirm',
  authenticate,
  hasPermission('CONFIRM_SO'),
  auditLog('SalesOrder'),
  salesOrdersController.confirm
);
router.patch(
  '/:id/ship',
  authenticate,
  hasPermission('SHIP_SO'),
  auditLog('SalesOrder'),
  salesOrdersController.ship
);
router.patch(
  '/:id/deliver',
  authenticate,
  hasPermission('SHIP_SO'),
  auditLog('SalesOrder'),
  salesOrdersController.deliver
);
router.patch(
  '/:id/cancel',
  authenticate,
  hasPermission('CREATE_SO'),
  auditLog('SalesOrder'),
  salesOrdersController.cancel
);

export default router;
