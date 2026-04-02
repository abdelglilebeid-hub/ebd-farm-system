'use client';

import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface MonthlyChartProps {
  data: any[];
  year: number;
}

export default function MonthlyChart({ data, year }: MonthlyChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-700 mb-4">المصروفات والإيرادات الشهرية - {year}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(val: number) => formatCurrency(val)} />
          <Legend />
          <Bar dataKey="مصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="إيرادات" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
