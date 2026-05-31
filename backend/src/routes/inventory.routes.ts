import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { stockInSchema, stockOutSchema, transferSchema } from '../validators/inventory.validator.js';

const router = Router();

router.get('/', authenticate, hasPermission('VIEW_PRODUCT'), inventoryController.getStockOverview);
router.get('/movements', authenticate, hasPermission('VIEW_PRODUCT'), inventoryController.getMovements);
router.post(
  '/stock-in',
  authenticate,
  hasPermission('STOCK_IN'),
  validate(stockInSchema),
  auditLog('Inventory'),
  inventoryController.stockIn
);
router.post(
  '/stock-out',
  authenticate,
  hasPermission('STOCK_OUT'),
  validate(stockOutSchema),
  auditLog('Inventory'),
  inventoryController.stockOut
);
router.post(
  '/transfer',
  authenticate,
  hasPermission('TRANSFER_STOCK'),
  validate(transferSchema),
  auditLog('Inventory'),
  inventoryController.transfer
);

export default router;
