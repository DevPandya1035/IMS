import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { hasPermission } from '../middlewares/hasPermission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auditLog } from '../middlewares/auditLog.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
import { loginSchema, registerSchema, updateProfileSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authLimiter, authController.refresh);
router.post(
  '/register',
  authenticate,
  hasPermission('MANAGE_USERS'),
  validate(registerSchema),
  auditLog('User'),
  authController.register
);
router.get('/profile', authenticate, authController.getProfile);
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);
router.get('/users', authenticate, hasPermission('MANAGE_USERS'), authController.getAllUsers);
router.get('/roles', authenticate, authController.getRoles);
router.patch(
  '/users/:id',
  authenticate,
  hasPermission('MANAGE_USERS'),
  auditLog('User'),
  authController.updateUser
);
router.delete(
  '/users/:id',
  authenticate,
  hasPermission('MANAGE_USERS'),
  auditLog('User'),
  authController.deleteUser
);

export default router;
