'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ForecastPoint {
  date: string;
  predictedDemand: number;
  confidence80Lower: number;
  confidence80Upper: number;
}

interface ForecastLineChartProps {
  data: ForecastPoint[];
}

export function ForecastLineChart({ data }: ForecastLineChartProps) {
  return (
    <div className="w-full h-80 bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl flex flex-col">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white tracking-tight">AI Demand Forecast</h4>
        <p className="text-xs text-gray-500">30-day demand projection with 80% confidence interval</p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#11131e',
                border: '1px solid #22263f',
                borderRadius: '12px',
                color: '#f3f4f6',
              }}
              labelStyle={{ fontSize: '11px', color: '#9ca3af' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
            />
            {/* Confidence Interval shaded area using range */}
            <Area
              name="Confidence Range"
              type="monotone"
              dataKey="confidence80Upper"
              stroke="none"
              fill="#8b5cf6"
              fillOpacity={0.1}
            />
            <Area
              name="Predicted Demand"
              type="monotone"
              dataKey="predictedDemand"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ForecastLineChart;
