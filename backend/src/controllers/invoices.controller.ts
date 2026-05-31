import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoices.service.js';
import { prisma } from '../config/database.js';

export const invoicesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.list(req.query as Record<string, string>);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.getById(req.params.id!);
      res.json({ success: true, data: invoice });
    } catch (error) { next(error); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.updateStatus(req.params.id!, req.body.status);
      res.json({ success: true, data: invoice });
    } catch (error) { next(error); }
  },
};

export const paymentsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await invoiceService.recordPayment(req.body);
      res.status(201).json({ success: true, data: payment });
    } catch (error) { next(error); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.listPayments(req.query as Record<string, string>);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },
};

export const customersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await prisma.customer.findMany({
        where: { isActive: true },
        include: { _count: { select: { salesOrders: true } } },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: customers });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id! },
        include: {
          salesOrders: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true },
          },
        },
      });
      if (!customer) {
        res.status(404).json({ success: false, error: 'Customer not found.' });
        return;
      }
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.create({ data: req.body });
      res.locals.createdId = customer.id;
      res.status(201).json({ success: true, data: customer });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.update({
        where: { id: req.params.id! },
        data: req.body,
      });
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const orderCount = await prisma.salesOrder.count({
        where: { customerId: req.params.id! },
      });
      if (orderCount > 0) {
        res.status(400).json({ success: false, error: 'Cannot delete customer with linked orders.' });
        return;
      }
      await prisma.customer.update({
        where: { id: req.params.id! },
        data: { isActive: false },
      });
      res.json({ success: true, data: { message: 'Customer deactivated.' } });
    } catch (error) { next(error); }
  },
};
