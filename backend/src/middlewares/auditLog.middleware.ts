import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { HTTP_METHOD_TO_ACTION } from '../types/payloads.js';
import { logger } from '../config/logger.js';

export function auditLog(entity: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const action = HTTP_METHOD_TO_ACTION[req.method];
          if (!action) return;

          await prisma.auditLog.create({
            data: {
              userId: req.user?.userId || null,
              action,
              entity,
              entityId: req.params.id || res.locals.createdId || null,
              details: {
                body: req.body,
                url: req.originalUrl,
                method: req.method,
              },
              ipAddress: req.ip || req.socket.remoteAddress || null,
            },
          });
        }
      } catch (error) {
        logger.error('Failed to write audit log', {
          error: error instanceof Error ? error.message : String(error),
          entity,
          url: req.originalUrl,
        });
      }
    });
    next();
  };
}
