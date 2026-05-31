import { Router } from 'express';
import authRouter from './auth.routes.js';
import productsRouter from './products.routes.js';
import categoriesRouter from './categories.routes.js';
import inventoryRouter from './inventory.routes.js';
import warehousesRouter from './warehouses.routes.js';
import purchaseOrdersRouter from './purchase-orders.routes.js';
import salesOrdersRouter from './sales-orders.routes.js';
import customersRouter from './customers.routes.js';
import suppliersRouter from './suppliers.routes.js';
import invoicesRouter from './invoices.routes.js';
import analyticsRouter from './analytics.routes.js';
import auditLogsRouter from './audit-logs.routes.js';
import notificationsRouter from './notifications.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/products', productsRouter);
router.use('/categories', categoriesRouter);
router.use('/inventory', inventoryRouter);
router.use('/warehouses', warehousesRouter);
router.use('/purchase-orders', purchaseOrdersRouter);
router.use('/sales-orders', salesOrdersRouter);
router.use('/customers', customersRouter);
router.use('/suppliers', suppliersRouter);
router.use('/invoices', invoicesRouter);
router.use('/analytics', analyticsRouter);
router.use('/audit-logs', auditLogsRouter);
router.use('/notifications', notificationsRouter);

export default router;
