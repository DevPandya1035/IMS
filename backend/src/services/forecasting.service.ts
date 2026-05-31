import { prisma } from '../config/database.js';
import { cache } from '../config/redis.js';
import { logger } from '../config/logger.js';

interface DemandPoint {
  date: string;
  demand: number;
}

interface ForecastPoint {
  date: string;
  predictedDemand: number;
  confidence80Lower: number;
  confidence80Upper: number;
}

interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  safetyStock: number;
  suggestedOrderQty: number;
  urgency: 'CRITICAL' | 'WARNING' | 'OPTIMAL';
  daysOfStockRemaining: number;
}

// ─── MODEL IMPLEMENTATIONS ──────────────────────────

function movingAverage(history: DemandPoint[], horizon: number): ForecastPoint[] {
  const demands = history.map((h) => h.demand);
  const windowSize = Math.min(7, demands.length);
  const avg =
    demands.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
  const stdDev = Math.sqrt(
    demands.slice(-windowSize).reduce((sum, d) => sum + (d - avg) ** 2, 0) / windowSize
  );

  const results: ForecastPoint[] = [];
  const lastDate = new Date(history[history.length - 1]!.date);
  for (let i = 1; i <= horizon; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    results.push({
      date: forecastDate.toISOString().slice(0, 10),
      predictedDemand: Math.round(avg),
      confidence80Lower: Math.max(0, Math.round(avg - 1.28 * stdDev)),
      confidence80Upper: Math.round(avg + 1.28 * stdDev),
    });
  }
  return results;
}

function linearRegression(history: DemandPoint[], horizon: number): ForecastPoint[] {
  const n = history.length;
  const demands = history.map((h) => h.demand);
  const xMean = (n - 1) / 2;
  const yMean = demands.reduce((a, b) => a + b, 0) / n;

  let numSum = 0;
  let denSum = 0;
  for (let i = 0; i < n; i++) {
    numSum += (i - xMean) * (demands[i]! - yMean);
    denSum += (i - xMean) ** 2;
  }

  const slope = denSum !== 0 ? numSum / denSum : 0;
  const intercept = yMean - slope * xMean;

  const residuals = demands.map((d, i) => d - (slope * i + intercept));
  const stdErr = Math.sqrt(
    residuals.reduce((sum, r) => sum + r ** 2, 0) / n
  );

  const results: ForecastPoint[] = [];
  const lastDate = new Date(history[history.length - 1]!.date);
  for (let i = 1; i <= horizon; i++) {
    const pred = Math.max(0, Math.round(slope * (n - 1 + i) + intercept));
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    results.push({
      date: forecastDate.toISOString().slice(0, 10),
      predictedDemand: pred,
      confidence80Lower: Math.max(0, Math.round(pred - 1.28 * stdErr)),
      confidence80Upper: Math.round(pred + 1.28 * stdErr),
    });
  }
  return results;
}

function holtWinters(
  history: DemandPoint[],
  horizon: number,
  seasonLength: number = 7,
  alpha: number = 0.3,
  beta: number = 0.1,
  gamma: number = 0.2
): ForecastPoint[] {
  const demands = history.map((h) => h.demand);
  const n = demands.length;

  if (n < seasonLength * 2) {
    return linearRegression(history, horizon);
  }

  // Initialize level and trend
  let level = demands.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength;
  let trend = 0;
  for (let i = 0; i < seasonLength; i++) {
    trend += (demands[seasonLength + i]! - demands[i]!) / seasonLength;
  }
  trend /= seasonLength;

  // Initialize seasonal factors
  const seasonal = new Array<number>(n + horizon);
  for (let i = 0; i < seasonLength; i++) {
    seasonal[i] = demands[i]! - level;
  }

  // Forward pass
  for (let t = seasonLength; t < n; t++) {
    const oldLevel = level;
    level = alpha * (demands[t]! - seasonal[t - seasonLength]!) + (1 - alpha) * (level + trend);
    trend = beta * (level - oldLevel) + (1 - beta) * trend;
    seasonal[t] = gamma * (demands[t]! - level) + (1 - gamma) * seasonal[t - seasonLength]!;
  }

  // Forecast error (MAD)
  let madSum = 0;
  for (let t = seasonLength; t < n; t++) {
    const forecast = level + trend + (seasonal[t - seasonLength] ?? 0);
    madSum += Math.abs(demands[t]! - forecast);
  }
  const mad = madSum / (n - seasonLength);
  const stdDev = mad * 1.25;

  // Forecast future
  const results: ForecastPoint[] = [];
  const lastDate = new Date(history[history.length - 1]!.date);
  for (let h = 1; h <= horizon; h++) {
    const seasonalIdx = n - seasonLength + ((h - 1) % seasonLength);
    const pred = Math.max(0, Math.round(level + h * trend + (seasonal[seasonalIdx] ?? 0)));
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + h);
    results.push({
      date: forecastDate.toISOString().slice(0, 10),
      predictedDemand: pred,
      confidence80Lower: Math.max(0, Math.round(pred - 1.28 * stdDev)),
      confidence80Upper: Math.round(pred + 1.28 * stdDev),
    });
  }
  return results;
}

function detectSeasonality(demands: number[]): number {
  if (demands.length < 14) return 0;
  const n = demands.length;
  const mean = demands.reduce((a, b) => a + b, 0) / n;

  // Autocorrelation at lag 7 (weekly)
  let num = 0;
  let den = 0;
  for (let i = 0; i < n - 7; i++) {
    num += (demands[i]! - mean) * (demands[i + 7]! - mean);
  }
  for (let i = 0; i < n; i++) {
    den += (demands[i]! - mean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function selectModel(history: DemandPoint[]): string {
  if (history.length < 30) return 'MOVING_AVERAGE';
  if (history.length < 60) return 'LINEAR_REGRESSION';
  const seasonalityScore = detectSeasonality(history.map((h) => h.demand));
  return seasonalityScore > 0.4 ? 'HOLT_WINTERS' : 'LINEAR_REGRESSION';
}

function detectAnomalies(
  recent: DemandPoint[],
  full: DemandPoint[],
  k: number = 2.5
): Array<{ date: string; demand: number; expected: number; deviation: number }> {
  const demands = full.map((h) => h.demand);
  const mean = demands.reduce((a, b) => a + b, 0) / demands.length;
  const stdDev = Math.sqrt(
    demands.reduce((sum, d) => sum + (d - mean) ** 2, 0) / demands.length
  );

  return recent
    .filter((p) => Math.abs(p.demand - mean) > k * stdDev)
    .map((p) => ({
      date: p.date,
      demand: p.demand,
      expected: Math.round(mean),
      deviation: Math.round(((p.demand - mean) / (stdDev || 1)) * 100) / 100,
    }));
}

export const forecastingService = {
  async getSalesHistory(productId: string, days: number): Promise<DemandPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        productId,
        movementType: { in: ['STOCK_OUT', 'TRANSFER_OUT'] },
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by day
    const dailyDemand = new Map<string, number>();
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      dailyDemand.set(date.toISOString().slice(0, 10), 0);
    }

    for (const m of movements) {
      const dateKey = m.createdAt.toISOString().slice(0, 10);
      const current = dailyDemand.get(dateKey) || 0;
      dailyDemand.set(dateKey, current + Math.abs(m.quantity));
    }

    return Array.from(dailyDemand.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, demand]) => ({ date, demand }));
  },

  async getDemandForecast(productId: string) {
    // Check cache
    const cacheKey = `forecast:${productId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const history = await this.getSalesHistory(productId, 90);

    if (history.length === 0) {
      return {
        forecast7: [],
        forecast30: [],
        anomalies: [],
        reorder: null,
        model: 'NONE',
        generatedAt: new Date(),
      };
    }

    const model = selectModel(history);
    let forecast7: ForecastPoint[];
    let forecast30: ForecastPoint[];

    switch (model) {
      case 'HOLT_WINTERS':
        forecast7 = holtWinters(history, 7);
        forecast30 = holtWinters(history, 30);
        break;
      case 'LINEAR_REGRESSION':
        forecast7 = linearRegression(history, 7);
        forecast30 = linearRegression(history, 30);
        break;
      default:
        forecast7 = movingAverage(history, 7);
        forecast30 = movingAverage(history, 30);
    }

    const anomalies = detectAnomalies(history.slice(-7), history);
    const reorder = await this.calculateReorder(productId, history);

    const result = {
      forecast7,
      forecast30,
      anomalies,
      reorder,
      model,
      generatedAt: new Date(),
    };

    // Cache for 24 hours
    await cache.set(cacheKey, JSON.stringify(result), 86400);
    return result;
  },

  async calculateReorder(productId: string, history: DemandPoint[]): Promise<ReorderSuggestion | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true },
    });
    if (!product) return null;

    const last30 = history.slice(-30).map((h) => h.demand);
    if (last30.length === 0) return null;

    const avgDailySales = last30.reduce((a, b) => a + b, 0) / last30.length;
    const maxDailySales = Math.max(...last30);
    const avgLeadTime = product.supplier?.avgLeadTimeDays ?? 7;
    const maxLeadTime = product.supplier?.maxLeadTimeDays ?? 14;

    const safetyStock = Math.ceil(
      maxDailySales * maxLeadTime - avgDailySales * avgLeadTime
    );
    const reorderLevel = Math.ceil(avgDailySales * avgLeadTime + safetyStock);

    // EOQ (simplified: ordering cost = 100, holding cost = 20% of cost price)
    const annualDemand = avgDailySales * 365;
    const orderingCost = 100;
    const holdingCost = Number(product.costPrice || product.price) * 0.2;
    const eoq = holdingCost > 0
      ? Math.ceil(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost))
      : Math.ceil(avgDailySales * 30);

    const daysRemaining = avgDailySales > 0
      ? Math.round((product.quantity / avgDailySales) * 10) / 10
      : Infinity;

    let urgency: 'CRITICAL' | 'WARNING' | 'OPTIMAL' = 'OPTIMAL';
    if (product.quantity < safetyStock) urgency = 'CRITICAL';
    else if (product.quantity < reorderLevel) urgency = 'WARNING';

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.quantity,
      reorderLevel,
      safetyStock,
      suggestedOrderQty: eoq,
      urgency,
      daysOfStockRemaining: daysRemaining,
    };
  },

  async getAllReorderSuggestions(): Promise<ReorderSuggestion[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const suggestions: ReorderSuggestion[] = [];
    for (const product of products) {
      const history = await this.getSalesHistory(product.id, 30);
      const reorder = await this.calculateReorder(product.id, history);
      if (reorder) {
        suggestions.push(reorder);
      }
    }

    return suggestions.sort((a, b) => {
      const urgencyOrder = { CRITICAL: 0, WARNING: 1, OPTIMAL: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  },
};
