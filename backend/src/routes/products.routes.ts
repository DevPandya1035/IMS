import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  createSupplierSchema,
  updateSupplierSchema,
} from '../validators/product.validator.js';

const router = Router();

// Products
router.get('/', authenticate, hasPermission('VIEW_PRODUCT'), productsController.list);
router.get('/:id', authenticate, hasPermission('VIEW_PRODUCT'), productsController.getById);
router.post(
  '/',
  authenticate,
  hasPermission('CREATE_PRODUCT'),
  validate(createProductSchema),
  auditLog('Product'),
  productsController.create
);
router.put(
  '/:id',
  authenticate,
  hasPermission('UPDATE_PRODUCT'),
  validate(updateProductSchema),
  auditLog('Product'),
  productsController.update
);
router.patch(
  '/:id',
  authenticate,
  hasPermission('UPDATE_PRODUCT'),
  validate(updateProductSchema),
  auditLog('Product'),
  productsController.update
);
router.delete(
  '/:id',
  authenticate,
  hasPermission('DELETE_PRODUCT'),
  auditLog('Product'),
  productsController.delete
);

export default router;
