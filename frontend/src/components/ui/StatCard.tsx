import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  loading = false,
}: StatCardProps) {
  return (
    <div className="p-6 bg-[#11131e] border border-[#22263f] rounded-2xl shadow-xl flex items-center justify-between transition-all duration-300 hover:border-[#3b426f]">
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
        {loading ? (
          <div className="h-8 w-24 bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        )}

        {change && !loading && (
          <p className="text-xs font-medium">
            <span
              className={
                changeType === 'positive'
                  ? 'text-emerald-500'
                  : changeType === 'negative'
                  ? 'text-red-500'
                  : 'text-gray-400'
              }
            >
              {change}
            </span>{' '}
            <span className="text-gray-600">vs last month</span>
          </p>
        )}
      </div>

      <div className="p-3 bg-[#171a2b] border border-[#262c4b] rounded-xl text-blue-500">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

export default StatCard;
