'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAppDispatch } from '../../../../store/hooks';
import { addToast } from '../../../../store/slices/toastSlice';
import { ForecastLineChart } from '../../../../components/charts/ForecastLineChart';
import { Badge } from '../../../../components/ui/Badge';
import { Loader2, Sparkles, AlertTriangle, ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function ForecastPage() {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [forecast, setForecast] = useState<any>(null);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [fetchingForecast, setFetchingForecast] = useState(false);

  const fetchProducts = async () => {
    try {
      setFetchingProducts(true);
      const res = await api.get('/products', { params: { limit: 1000, isActive: 'true' } });
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingProducts(false);
    }
  };

  const fetchForecast = async (productId: string) => {
    try {
      setFetchingForecast(true);
      const res = await api.get('/analytics/forecast', {
        params: { productId },
      });
      setForecast(res.data.data);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to generate AI demand forecast.',
          type: 'error',
        })
      );
    } finally {
      setFetchingForecast(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    if (productId) {
      fetchForecast(productId);
    } else {
      setForecast(null);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      CRITICAL: 'red',
      WARNING: 'amber',
      OPTIMAL: 'emerald',
    };
    return <Badge color={colors[urgency as keyof typeof colors] as any}>{urgency}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/reports" className="hover:text-white transition-colors flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to valuation
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <Sparkles className="h-6 w-6 mr-2 text-indigo-400" />
          AI Demand Forecasting
        </h1>
        <p className="text-sm text-gray-400">
          Holt-Winters Triple Exponential Smoothing forecasting tool for inventory optimization
        </p>
      </div>

      {/* Selector card */}
      <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl flex items-center space-x-4">
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Select Product
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => handleProductChange(e.target.value)}
            disabled={fetchingProducts}
            className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value="">Choose a product for projection...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
        {fetchingForecast && <Loader2 className="h-6 w-6 text-blue-500 animate-spin mt-6" />}
      </div>

      {/* Main Forecast Layout */}
      {forecast && !fetchingForecast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
          {/* Chart panel */}
          <div className="lg:col-span-2 space-y-6">
            <ForecastLineChart data={forecast.forecast30} />

            {/* Anomalies Panel */}
            {forecast.anomalies && forecast.anomalies.length > 0 && (
              <div className="bg-[#1b191f] border border-red-500/20 p-5 rounded-2xl text-red-300">
                <h4 className="text-sm font-semibold flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                  Spike & Anomaly Alerts Detected
                </h4>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-gray-500 border-b border-red-500/10 pb-2">
                        <th>Date</th>
                        <th className="text-right">Observed Demand</th>
                        <th className="text-right">Expected Mean</th>
                        <th className="text-right">Deviation (Sigma)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.anomalies.map((a: any, i: number) => (
                        <tr key={i} className="border-b border-red-500/5 last:border-none">
                          <td className="py-2">{a.date}</td>
                          <td className="py-2 text-right font-semibold text-white">{a.demand} units</td>
                          <td className="py-2 text-right">{a.expected} units</td>
                          <td className="py-2 text-right text-red-400 font-bold font-mono">+{a.deviation}σ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Smart Reorder Stats panel */}
          <div className="space-y-6">
            {forecast.reorder ? (
              <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-[#22263f] pb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Replenishment Suggestions
                  </h3>
                  {getUrgencyBadge(forecast.reorder.urgency)}
                </div>

                <div className="space-y-3.5 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Model Selection</span>
                    <span className="font-semibold text-indigo-400 font-mono">{forecast.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock on Hand</span>
                    <span className="font-semibold text-white">{forecast.reorder.currentStock} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reorder Threshold</span>
                    <span className="font-semibold text-white">{forecast.reorder.reorderLevel} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety Stock Target</span>
                    <span className="font-semibold text-white">{forecast.reorder.safetyStock} units</span>
                  </div>
                  <div className="flex justify-between border-t border-[#22263f] pt-3">
                    <span>Suggested Order (EOQ)</span>
                    <span className="font-semibold text-blue-400 text-sm">{forecast.reorder.suggestedOrderQty} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Remaining</span>
                    <span className="font-semibold text-white">
                      {forecast.reorder.daysOfStockRemaining === Infinity
                        ? 'No sales demand'
                        : `${forecast.reorder.daysOfStockRemaining} days`}
                    </span>
                  </div>
                </div>

                {forecast.reorder.urgency !== 'OPTIMAL' && (
                  <div className="pt-2">
                    <Link
                      href={`/purchase-orders/new?supplierId=${forecast.reorder.supplierId || ''}`}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-all shadow shadow-blue-500/20"
                    >
                      Draft Purchase Order <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl text-center py-20 text-gray-500">
                Insufficient history to compute reorder parameters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
