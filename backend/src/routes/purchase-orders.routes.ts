import { Router } from 'express';
import { purchaseOrdersController } from '../controllers/purchase-orders.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, receivePOSchema } from '../validators/purchase-order.validator.js';

const router = Router();

router.get('/', authenticate, hasPermission('CREATE_PO'), purchaseOrdersController.list);
router.get('/:id', authenticate, hasPermission('CREATE_PO'), purchaseOrdersController.getById);
router.post(
  '/',
  authenticate,
  hasPermission('CREATE_PO'),
  validate(createPurchaseOrderSchema),
  auditLog('PurchaseOrder'),
  purchaseOrdersController.create
);
router.put(
  '/:id',
  authenticate,
  hasPermission('CREATE_PO'),
  validate(updatePurchaseOrderSchema),
  auditLog('PurchaseOrder'),
  purchaseOrdersController.update
);
router.delete(
  '/:id',
  authenticate,
  hasPermission('CREATE_PO'),
  auditLog('PurchaseOrder'),
  purchaseOrdersController.delete
);
router.patch(
  '/:id/approve',
  authenticate,
  hasPermission('APPROVE_PO'),
  auditLog('PurchaseOrder'),
  purchaseOrdersController.approve
);
router.patch(
  '/:id/receive',
  authenticate,
  hasPermission('RECEIVE_PO'),
  validate(receivePOSchema),
  auditLog('PurchaseOrder'),
  purchaseOrdersController.receive
);
router.patch(
  '/:id/cancel',
  authenticate,
  hasPermission('CREATE_PO'),
  auditLog('PurchaseOrder'),
  purchaseOrdersController.cancel
);

export default router;
