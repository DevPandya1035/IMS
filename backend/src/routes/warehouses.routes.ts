import { Router } from 'express';
import { warehousesController } from '../controllers/inventory.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { createWarehouseSchema, updateWarehouseSchema } from '../validators/inventory.validator.js';

const router = Router();

router.get('/', authenticate, warehousesController.list);
router.get('/:id', authenticate, warehousesController.getById);
router.post(
  '/',
  authenticate,
  hasPermission('MANAGE_WAREHOUSES'),
  validate(createWarehouseSchema),
  auditLog('Warehouse'),
  warehousesController.create
);
router.put(
  '/:id',
  authenticate,
  hasPermission('MANAGE_WAREHOUSES'),
  validate(updateWarehouseSchema),
  auditLog('Warehouse'),
  warehousesController.update
);
router.delete(
  '/:id',
  authenticate,
  hasPermission('MANAGE_WAREHOUSES'),
  auditLog('Warehouse'),
  warehousesController.delete
);

export default router;
