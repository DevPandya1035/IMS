import React from 'react';

type BadgeColor = 'blue' | 'emerald' | 'amber' | 'red' | 'gray' | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
}

const colorMap: Record<BadgeColor, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}

export default Badge;
