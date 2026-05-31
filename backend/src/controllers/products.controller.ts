import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/products.service.js';

export const productsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.list(req.query as Record<string, string>);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id!);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body);
      res.locals.createdId = product.id;
      res.status(201).json({ success: true, data: product });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.update(req.params.id!, req.body);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.delete(req.params.id!);
      res.json({ success: true, data: { message: 'Product deactivated.' } });
    } catch (error) { next(error); }
  },

  // Categories
  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productService.listCategories();
      res.json({ success: true, data: categories });
    } catch (error) { next(error); }
  },

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await productService.createCategory(req.body);
      res.locals.createdId = category.id;
      res.status(201).json({ success: true, data: category });
    } catch (error) { next(error); }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await productService.updateCategory(req.params.id!, req.body);
      res.json({ success: true, data: category });
    } catch (error) { next(error); }
  },

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteCategory(req.params.id!);
      res.json({ success: true, data: { message: 'Category deactivated.' } });
    } catch (error) { next(error); }
  },

  // Suppliers
  async listSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await productService.listSuppliers();
      res.json({ success: true, data: suppliers });
    } catch (error) { next(error); }
  },

  async getSupplierById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await productService.getSupplierById(req.params.id!);
      res.json({ success: true, data: supplier });
    } catch (error) { next(error); }
  },

  async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await productService.createSupplier(req.body);
      res.locals.createdId = supplier.id;
      res.status(201).json({ success: true, data: supplier });
    } catch (error) { next(error); }
  },

  async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await productService.updateSupplier(req.params.id!, req.body);
      res.json({ success: true, data: supplier });
    } catch (error) { next(error); }
  },

  async deleteSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteSupplier(req.params.id!);
      res.json({ success: true, data: { message: 'Supplier deactivated.' } });
    } catch (error) { next(error); }
  },
};
