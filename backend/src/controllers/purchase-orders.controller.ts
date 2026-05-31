import { Request, Response, NextFunction } from 'express';
import { purchaseOrderService } from '../services/purchase-orders.service.js';

export const purchaseOrdersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseOrderService.list(req.query as Record<string, string>);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await purchaseOrderService.getById(req.params.id!);
      res.json({ success: true, data: po });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await purchaseOrderService.create(req.body, req.user!.userId);
      res.locals.createdId = po.id;
      res.status(201).json({ success: true, data: po });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await purchaseOrderService.update(req.params.id!, req.body);
      res.json({ success: true, data: po });
    } catch (error) { next(error); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await purchaseOrderService.delete(req.params.id!);
      res.json({ success: true, data: { message: 'Purchase order deleted.' } });
    } catch (error) { next(error); }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await purchaseOrderService.approve(req.params.id!, req.user!.userId);
      res.json({ success: true, data: po });
    } catch (error) { next(error); }
  },

  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseOrderService.receive(req.params.id!, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await purchaseOrderService.cancel(req.params.id!);
      res.json({ success: true, data: po });
    } catch (error) { next(error); }
  },
};
