import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notifications.service.js';

export const notificationsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const unreadOnly = req.query.unread === 'true';
      const list = await notificationService.getForUser(req.user!.userId, unreadOnly);
      res.json({ success: true, data: list });
    } catch (error) { next(error); }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markRead(req.params.id!);
      res.json({ success: true, data: notification });
    } catch (error) { next(error); }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllRead(req.user!.userId);
      res.json({ success: true, data: { message: 'All notifications marked as read.' } });
    } catch (error) { next(error); }
  },
};
