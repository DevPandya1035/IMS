'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SalesAreaChartProps {
  data: Array<{ date: string; amount: number }>;
}

export function SalesAreaChart({ data }: SalesAreaChartProps) {
  // Format currency for Y-Axis and Tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full h-80 bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl flex flex-col">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white tracking-tight">Revenue Trend</h4>
        <p className="text-xs text-gray-500">Daily sales revenue trends</p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2235" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#4b5563"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#4b5563"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#11131e',
                border: '1px solid #22263f',
                borderRadius: '12px',
                color: '#f3f4f6',
              }}
              formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
              labelStyle={{ fontSize: '11px', color: '#9ca3af' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSales)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SalesAreaChart;
