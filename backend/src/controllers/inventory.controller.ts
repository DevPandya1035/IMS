import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service.js';

export const inventoryController = {
  async getStockOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getStockOverview(req.query as Record<string, string>);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },

  async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getMovements(req.query as Record<string, string>);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },

  async stockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.stockIn(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async stockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.stockOut(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.transfer(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  },
};

export const warehousesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouses = await inventoryService.listWarehouses();
      res.json({ success: true, data: warehouses });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await inventoryService.getWarehouseById(req.params.id!);
      res.json({ success: true, data: warehouse });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await inventoryService.createWarehouse(req.body);
      res.locals.createdId = warehouse.id;
      res.status(201).json({ success: true, data: warehouse });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await inventoryService.updateWarehouse(req.params.id!, req.body);
      res.json({ success: true, data: warehouse });
    } catch (error) { next(error); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await inventoryService.deleteWarehouse(req.params.id!);
      res.json({ success: true, data: { message: 'Warehouse deactivated.' } });
    } catch (error) { next(error); }
  },
};
