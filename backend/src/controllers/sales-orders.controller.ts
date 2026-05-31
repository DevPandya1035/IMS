import { Request, Response, NextFunction } from 'express';
import { salesOrderService } from '../services/sales-orders.service.js';

export const salesOrdersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await salesOrderService.list(req.query as Record<string, string>);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const so = await salesOrderService.getById(req.params.id!);
      res.json({ success: true, data: so });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const so = await salesOrderService.create(req.body, req.user!.userId);
      res.locals.createdId = so.id;
      res.status(201).json({ success: true, data: so });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const so = await salesOrderService.update(req.params.id!, req.body);
      res.json({ success: true, data: so });
    } catch (error) { next(error); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await salesOrderService.delete(req.params.id!);
      res.json({ success: true, data: { message: 'Sales order deleted.' } });
    } catch (error) { next(error); }
  },

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const so = await salesOrderService.confirm(req.params.id!, req.user!.userId);
      res.json({ success: true, data: so });
    } catch (error) { next(error); }
  },

  async ship(req: Request, res: Response, next: NextFunction) {
    try {
      const so = await salesOrderService.ship(req.params.id!, req.user!.userId);
      res.json({ success: true, data: so });
    } catch (error) { next(error); }
  },

  async deliver(req: Request, res: Response, next: NextFunction) {
    try {
      const so = await salesOrderService.deliver(req.params.id!);
      res.json({ success: true, data: so });
    } catch (error) { next(error); }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const so = await salesOrderService.cancel(req.params.id!, req.user!.userId);
      res.json({ success: true, data: so });
    } catch (error) { next(error); }
  },
};
