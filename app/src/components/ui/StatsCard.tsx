'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
}

const colorMap = {
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-700', border: 'border-green-200' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-700', border: 'border-red-200' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
};

export default function StatsCard({ title, value, change, icon: Icon, color }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn('rounded-xl border p-5', colors.bg, colors.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(change).toFixed(1)}%</span>
              <span className="text-gray-400">عن الشهر السابق</span>
            </div>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center', colors.icon)}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
