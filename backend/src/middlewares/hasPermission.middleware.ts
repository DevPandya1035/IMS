import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from './errorHandler.middleware.js';

export function hasPermission(requiredPermission: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const userRole = req.user.role;

      // Admins bypass all permission checks
      if (userRole === 'Admin') {
        next();
        return;
      }

      const hasAccess = await prisma.rolePermission.findFirst({
        where: {
          role: { roleName: userRole },
          permission: { permissionName: requiredPermission },
        },
      });

      if (!hasAccess) {
        throw new AppError('Forbidden. Insufficient permissions.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
