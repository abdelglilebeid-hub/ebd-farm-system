'use client';

import { formatCurrency } from '@/lib/utils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#16a34a', '#2563eb', '#eab308', '#dc2626', '#9333ea', '#06b6d4', '#f97316', '#ec4899'];

interface CategoryChartProps {
  data: any[];
}

export default function CategoryChart({ data }: CategoryChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-700 mb-4">توزيع المصروفات حسب النوع</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
              outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          لا توجد بيانات لهذا الشهر
        </div>
      )}
    </div>
  );
}
