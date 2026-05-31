import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { createCategorySchema, updateCategorySchema } from '../validators/product.validator.js';

const router = Router();

router.get('/', authenticate, productsController.listCategories);
router.post(
  '/',
  authenticate,
  hasPermission('MANAGE_CATEGORIES'),
  validate(createCategorySchema),
  auditLog('Category'),
  productsController.createCategory
);
router.put(
  '/:id',
  authenticate,
  hasPermission('MANAGE_CATEGORIES'),
  validate(updateCategorySchema),
  auditLog('Category'),
  productsController.updateCategory
);
router.delete(
  '/:id',
  authenticate,
  hasPermission('MANAGE_CATEGORIES'),
  auditLog('Category'),
  productsController.deleteCategory
);

export default router;
