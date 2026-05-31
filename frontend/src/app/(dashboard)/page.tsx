'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/toastSlice';
import { api } from '../../lib/api';
import { StatCard } from '../../components/ui/StatCard';
import { SalesAreaChart } from '../../components/charts/SalesAreaChart';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import {
  Package,
  AlertTriangle,
  Coins,
  ShoppingCart,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const [kpis, setKpis] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [reorders, setReorders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpiRes, trendRes, forecastRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/trends'),
        api.get('/analytics/forecast'),
      ]);

      setKpis(kpiRes.data.data);
      // Map "revenue" returned from API to "amount" expected by SalesAreaChart
      const formattedTrends = (trendRes.data.data || []).map((t: any) => ({
        date: t.date,
        amount: t.revenue,
      }));
      setTrends(formattedTrends);
      setReorders(forecastRes.data.data?.reorders || []);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to load dashboard metrics.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const reorderColumns = [
    {
      header: 'Product Name',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-white">{row.productName}</span>
          <span className="block text-[10px] text-gray-500 font-mono">ID: {row.productId.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      accessor: (row: any) => <span className="font-semibold text-white">{row.currentStock} units</span>,
    },
    {
      header: 'Reorder Level',
      accessor: (row: any) => <span className="text-gray-400">{row.reorderLevel} units</span>,
    },
    {
      header: 'Safety Stock',
      accessor: (row: any) => <span className="text-gray-400">{row.safetyStock} units</span>,
    },
    {
      header: 'EOQ Suggestion',
      accessor: (row: any) => (
        <span className="text-blue-400 font-semibold">{row.suggestedOrderQty} units</span>
      ),
    },
    {
      header: 'Urgency',
      accessor: (row: any) => {
        const colors = {
          CRITICAL: 'red',
          WARNING: 'amber',
          OPTIMAL: 'emerald',
        };
        return <Badge color={colors[row.urgency as keyof typeof colors] as any}>{row.urgency}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            Dashboard overview
          </h1>
          <p className="text-sm text-gray-400">Manage real-time inventory assets and projections</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/inventory/adjustments"
            className="px-4 py-2 bg-[#171926] hover:bg-[#1f2235] border border-[#2c324e] rounded-xl text-sm font-medium text-gray-300 transition-colors"
          >
            Adjust Stock
          </Link>
          <Link
            href="/purchase-orders/new"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20"
          >
            Create PO
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Products"
          value={kpis?.totalProducts || 0}
          icon={Package}
          loading={loading}
        />
        <StatCard
          title="Low Stock Products"
          value={kpis?.lowStockProducts || 0}
          change={kpis?.lowStockProducts > 0 ? `${kpis.lowStockProducts} items` : 'No items'}
          changeType={kpis?.lowStockProducts > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          loading={loading}
        />
        <StatCard
          title="Sales Revenue"
          value={formatCurrency(kpis?.totalRevenue || 0)}
          icon={Coins}
          loading={loading}
        />
        <StatCard
          title="Pending Sales Orders"
          value={kpis?.pendingOrders || 0}
          change={kpis?.pendingOrders > 0 ? 'Action required' : 'Clear'}
          changeType={kpis?.pendingOrders > 0 ? 'neutral' : 'positive'}
          icon={ShoppingCart}
          loading={loading}
        />
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Area Trend */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="w-full h-80 bg-[#11131e] border border-[#22263f] rounded-2xl animate-pulse" />
          ) : (
            <SalesAreaChart data={trends} />
          )}
        </div>

        {/* Recent Inventory Movements log */}
        <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 flex flex-col h-80">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white tracking-tight flex items-center">
                <Activity className="h-4 w-4 mr-2 text-blue-400" />
                Live Stock Movements
              </h4>
              <p className="text-xs text-gray-500">Latest adjustments and transfers</p>
            </div>
            <Link
              href="/inventory/movements"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center"
            >
              Logs <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-800/40 rounded-xl animate-pulse" />
              ))
            ) : !kpis?.recentMovements || kpis.recentMovements.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-xs">No recent movements.</div>
            ) : (
              kpis.recentMovements.map((m: any) => {
                const colors = {
                  STOCK_IN: 'text-green-400',
                  STOCK_OUT: 'text-red-400',
                  TRANSFER_IN: 'text-blue-400',
                  TRANSFER_OUT: 'text-blue-400',
                  RETURN: 'text-purple-400',
                };
                return (
                  <div
                    key={m.id}
                    className="p-3 bg-[#141725] border border-[#22263f]/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white truncate max-w-[150px]">{m.product.name}</p>
                      <span className="text-[10px] text-gray-500">
                        {m.warehouse.warehouseName} • {m.user?.name || 'System'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${colors[m.movementType as keyof typeof colors] || 'text-white'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                      <span className="block text-[9px] text-gray-600 mt-0.5">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Suggestion list */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white tracking-tight">
            AI Replenishment Suggestions
          </h3>
        </div>
        <div className="h-80">
          <DataTable
            columns={reorderColumns}
            data={reorders.slice(0, 5)}
            loading={loading}
            searchPlaceholder="Filter AI recommendations..."
          />
        </div>
      </div>
    </div>
  );
}
