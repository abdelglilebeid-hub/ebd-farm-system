'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { formatCurrency, formatNumber, getMonthName, getCurrentYear, getCurrentMonth } from '@/lib/utils';
import StatsCard from '@/components/ui/StatsCard';
import {
  Receipt, ShoppingCart, TrendingUp, Palmtree,
  ClipboardList, CreditCard, Bell, CheckCircle,
  AlertTriangle, Clock
} from 'lucide-react';

// Dynamic import recharts to avoid SSR hydration issues
const RechartsBarChart = dynamic(() => import('@/components/charts/MonthlyChart'), { ssr: false });
const RechartsPieChart = dynamic(() => import('@/components/charts/CategoryChart'), { ssr: false });

const supabase = createClient();

export default function DashboardPage() {
  const { profile, permissions } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [stats, setStats] = useState({
    totalExpenses: 0, totalRevenue: 0, netProfit: 0,
    totalPalms: 4380, activeTasks: 0, pendingPayments: 0,
    prevMonthExpenses: 0, prevMonthRevenue: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const year = getCurrentYear();
  const month = getCurrentMonth();

  const fetchDashboard = useCallback(async () => {
    try {
      // Current month expenses
      const { data: expData } = await supabase
        .from('expenses')
        .select('total_amount, expense_category')
        .eq('year', year)
        .eq('month', month);

      const totalExp = expData?.reduce((s, e) => s + (e.total_amount || 0), 0) || 0;

      // Previous month expenses
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      const { data: prevExpData } = await supabase
        .from('expenses')
        .select('total_amount')
        .eq('year', prevY)
        .eq('month', prevM);
      const prevExp = prevExpData?.reduce((s, e) => s + (e.total_amount || 0), 0) || 0;

      // Current month sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('net_amount, total_amount')
        .eq('year', year)
        .eq('month', month);
      const totalRev = salesData?.reduce((s, e) => s + (e.net_amount || e.total_amount || 0), 0) || 0;

      // Previous month sales
      const { data: prevSalesData } = await supabase
        .from('sales')
        .select('net_amount, total_amount')
        .eq('year', prevY)
        .eq('month', prevM);
      const prevRev = prevSalesData?.reduce((s, e) => s + (e.net_amount || e.total_amount || 0), 0) || 0;

      // Active tasks
      const { count: taskCount } = await supabase
        .from('farm_tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress']);

      // Pending payments
      const { count: payCount } = await supabase
        .from('payment_vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('is_paid', false);

      setStats({
        totalExpenses: totalExp,
        totalRevenue: totalRev,
        netProfit: totalRev - totalExp,
        totalPalms: 4380,
        activeTasks: taskCount || 0,
        pendingPayments: payCount || 0,
        prevMonthExpenses: prevExp,
        prevMonthRevenue: prevRev,
      });

      // Category breakdown
      if (expData) {
        const cats: Record<string, number> = {};
        expData.forEach(e => {
          const cat = e.expense_category || 'اخري';
          cats[cat] = (cats[cat] || 0) + (e.total_amount || 0);
        });
        setCategoryData(Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8));
      }

      // Monthly trend (current year)
      const { data: allExp } = await supabase
        .from('expenses')
        .select('month, total_amount')
        .eq('year', year);
      const { data: allSales } = await supabase
        .from('sales')
        .select('month, net_amount, total_amount')
        .eq('year', year);

      const monthly: Record<number, { expenses: number; revenue: number }> = {};
      for (let m = 1; m <= 12; m++) monthly[m] = { expenses: 0, revenue: 0 };
      allExp?.forEach(e => { monthly[e.month].expenses += e.total_amount || 0; });
      allSales?.forEach(s => { monthly[s.month].revenue += s.net_amount || s.total_amount || 0; });
      setMonthlyData(Object.entries(monthly).map(([m, d]) => ({
        month: getMonthName(parseInt(m)),
        مصروفات: d.expenses,
        إيرادات: d.revenue,
      })));
