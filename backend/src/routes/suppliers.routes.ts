import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { createSupplierSchema, updateSupplierSchema } from '../validators/product.validator.js';

const router = Router();

router.get('/', authenticate, hasPermission('CREATE_PO'), productsController.listSuppliers);
router.get('/:id', authenticate, hasPermission('CREATE_PO'), productsController.getSupplierById);
router.post(
  '/',
  authenticate,
  hasPermission('CREATE_PO'),
  validate(createSupplierSchema),
  auditLog('Supplier'),
  productsController.createSupplier
);
router.put(
  '/:id',
  authenticate,
  hasPermission('CREATE_PO'),
  validate(updateSupplierSchema),
  auditLog('Supplier'),
  productsController.updateSupplier
);
router.delete(
  '/:id',
  authenticate,
  hasPermission('CREATE_PO'),
  auditLog('Supplier'),
  productsController.deleteSupplier
);

export default router;
