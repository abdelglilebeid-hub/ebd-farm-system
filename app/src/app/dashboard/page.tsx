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

      // Recent expenses
      const { data: recent } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentExpenses(recent || []);

      // Recent tasks
      const { data: tasks } = await supabase
        .from('farm_tasks')
        .select('*, farm:farms(name)')
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(5);
      setRecentTasks(tasks || []);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err?.message || 'حدث خطأ أثناء تحميل البيانات');
    }
  }, [year, month]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const expChange = stats.prevMonthExpenses > 0
    ? ((stats.totalExpenses - stats.prevMonthExpenses) / stats.prevMonthExpenses) * 100
    : undefined;
  const revChange = stats.prevMonthRevenue > 0
    ? ((stats.totalRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue) * 100
    : undefined;

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={() => { setError(null); fetchDashboard(); }} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          مرحباً {profile?.full_name || ''}
        </h1>
        <p className="text-gray-500 mt-1">
          {getMonthName(month)} {year} - ملخص العمليات والمحاسبة
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {permissions?.canViewFinancials && (
          <>
            <StatsCard title="المصروفات (الشهر الحالي)" value={formatCurrency(stats.totalExpenses)} change={expChange} icon={Receipt} color="red" />
            <StatsCard title="الإيرادات (الشهر الحالي)" value={formatCurrency(stats.totalRevenue)} change={revChange} icon={ShoppingCart} color="green" />
            <StatsCard title="صافي الربح" value={formatCurrency(stats.netProfit)} icon={TrendingUp} color={stats.netProfit >= 0 ? 'green' : 'red'} />
          </>
        )}
        <StatsCard title="إجمالي النخيل" value={formatNumber(stats.totalPalms)} icon={Palmtree} color="blue" />
        <StatsCard title="مهام نشطة" value={formatNumber(stats.activeTasks)} icon={ClipboardList} color="yellow" />
        {permissions?.canViewFinancials && (
          <StatsCard title="مدفوعات معلقة" value={formatNumber(stats.pendingPayments)} icon={CreditCard} color="purple" />
        )}
      </div>

      {/* Charts Row */}
      {permissions?.canViewReports && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RechartsBarChart data={monthlyData} year={year} />
          <RechartsPieChart data={categoryData} />
        </div>
      )}

      {/* Bottom Row: Recent Items + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Expenses */}
        {permissions?.canViewFinancials && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-700 mb-4">آخر المصروفات</h3>
            <div className="space-y-3">
              {recentExpenses.length === 0 ? (
                <p className="text-gray-400 text-center py-6">لا توجد مصروفات حديثة</p>
              ) : (
                recentExpenses.map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{exp.description}</p>
                      <p className="text-xs text-gray-400">{exp.expense_category} - {exp.year}/{exp.month}/{exp.day}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(exp.total_amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notifications + Tasks */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Bell size={16} />
                الإشعارات
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 5).map(notif => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    notif.is_read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {notif.priority === 'critical' ? (
                      <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <Bell size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-700">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-gray-400 text-center py-4 text-sm">لا توجد إشعارات</p>
              )}
            </div>
          </div>

          {/* Active Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
              <ClipboardList size={16} />
              المهام النشطة
            </h3>
            <div className="space-y-2">
              {recentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{task.title}</p>
                    <p className="text-[10px] text-gray-400">{task.farm?.name}</p>
                  </div>
                  {task.status === 'in_progress' && (
                    <Clock size={12} className="text-yellow-500 shrink-0" />
                  )}
                </div>
              ))}
              {recentTasks.length === 0 && (
                <p className="text-gray-400 text-center py-4 text-sm">لا توجد مهام نشطة</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
