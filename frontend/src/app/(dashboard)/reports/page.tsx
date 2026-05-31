'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAppDispatch } from '../../../store/hooks';
import { addToast } from '../../../store/slices/toastSlice';
import { DataTable } from '../../../components/ui/DataTable';
import { StatCard } from '../../../components/ui/StatCard';
import { Coins, PiggyBank, BadgeCent, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ValuationReportPage() {
  const dispatch = useAppDispatch();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchValuation = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/valuation');
      setData(res.data.data);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to load valuation analytics.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuation();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns = [
    {
      header: 'Product Name',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-white">{row.name}</span>
          <span className="block text-[10px] text-gray-500 font-mono">{row.sku}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
    },
    {
      header: 'On Hand',
      accessor: (row: any) => <span className="font-semibold text-white">{row.quantity} units</span>,
    },
    {
      header: 'Unit Cost',
      accessor: (row: any) => <span>₹{row.costPrice.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Unit Retail',
      accessor: (row: any) => <span>₹{row.unitPrice.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Cost Value',
      accessor: (row: any) => (
        <span className="font-mono font-semibold">₹{row.costValue.toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: 'Retail Value',
      accessor: (row: any) => (
        <span className="font-mono font-semibold text-white">₹{row.retailValue.toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: 'Gross Margin',
      accessor: (row: any) => (
        <span className={`font-semibold ${row.margin >= 30 ? 'text-green-400' : 'text-gray-400'}`}>
          {row.margin}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Valuation & COGS</h1>
          <p className="text-sm text-gray-400">Review total asset retail values, cost values, and margins</p>
        </div>
        <div className="flex items-center">
          <Link
            href="/reports/forecast"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-indigo-500/20 flex items-center"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Demand Forecasts
          </Link>
        </div>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Asset Value (Retail)"
          value={formatCurrency(data?.totalRetailValue || 0)}
          icon={Coins}
          loading={loading}
        />
        <StatCard
          title="Asset Cost (COGS)"
          value={formatCurrency(data?.totalCostValue || 0)}
          icon={PiggyBank}
          loading={loading}
        />
        <StatCard
          title="Potential Gross Profit"
          value={formatCurrency(data?.potentialProfit || 0)}
          change={
            data?.totalRetailValue
              ? `${Math.round(
                  ((data.totalRetailValue - data.totalCostValue) / data.totalRetailValue) * 100
                )}% average margin`
              : ''
          }
          changeType="positive"
          icon={BadgeCent}
          loading={loading}
        />
      </div>

      {/* Main product valuation list */}
      <div className="h-[calc(100vh-270px)]">
        <DataTable columns={columns} data={data?.items || []} loading={loading} />
      </div>
    </div>
  );
}
