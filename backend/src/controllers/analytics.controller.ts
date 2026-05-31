import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { forecastingService } from '../services/forecasting.service.js';
import { prisma } from '../config/database.js';

export const analyticsController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await analyticsService.getDashboardKPIs();
      res.json({ success: true, data: kpis });
    } catch (error) { next(error); }
  },

  async salesTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const trends = await analyticsService.getSalesTrends(startDate, endDate);
      res.json({ success: true, data: trends });
    } catch (error) { next(error); }
  },

  async inventoryValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const valuation = await analyticsService.getInventoryValuation();
      res.json({ success: true, data: valuation });
    } catch (error) { next(error); }
  },

  async forecast(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.query as { productId?: string };
      if (productId) {
        const forecast = await forecastingService.getDemandForecast(productId);
        res.json({ success: true, data: forecast });
      } else {
        const reorders = await forecastingService.getAllReorderSuggestions();
        res.json({ success: true, data: { reorders, generatedAt: new Date() } });
      }
    } catch (error) { next(error); }
  },
};

export const auditLogsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (req.query.entity) where.entity = req.query.entity;
      if (req.query.action) where.action = req.query.action;
      if (req.query.userId) where.userId = req.query.userId;

      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) { next(error); }
  },
};
