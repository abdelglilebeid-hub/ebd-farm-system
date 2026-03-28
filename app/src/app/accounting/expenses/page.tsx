'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthName, getCurrentYear } from '@/lib/utils';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { EXPENSE_CATEGORIES, LABOR_TYPES, type Expense, type Farm } from '@/types/database';
import { Plus, Filter, Download } from 'lucide-react';

export default function ExpensesPage() {
  const { profile, permissions } = useAuth();
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState(getCurrentYear());
  const [filterMonth, setFilterMonth] = useState(0); // 0 = all
  const [filterFarm, setFilterFarm] = useState('');

  const emptyForm = {
    year: getCurrentYear(), month: new Date().getMonth() + 1, day: new Date().getDate(),
    sector_name: '', farm_id: '', season: '', expense_category: '' as any,
    description: '', labor_type: '' as any, worker_count: 0, fertilizer_name: '',
    unit: '', quantity: 0, unit_price: 0, expense_amount: 0, labor_cost: 0,
    fertilizer_cost: 0, total_amount: 0, notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('expenses').select('*, farm:farms(name)').eq('year', filterYear).order('month', { ascending: false }).order('day', { ascending: false });
    if (filterMonth > 0) query = query.eq('month', filterMonth);
    if (filterFarm) query = query.eq('farm_id', filterFarm);
    const { data } = await query;
    setExpenses(data || []);

    const { data: farmData } = await supabase.from('farms').select('*').eq('is_active', true);
    setFarms(farmData || []);
    setLoading(false);
  }, [supabase, filterYear, filterMonth, filterFarm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateTotal = (updates: Partial<typeof form>) => {
    const merged = { ...form, ...updates };
    const total = (merged.expense_amount || 0) + (merged.labor_cost || 0) + (merged.fertilizer_cost || 0);
    setForm({ ...merged, total_amount: total || (merged.quantity || 0) * (merged.unit_price || 0) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      expense_date: `${form.year}-${String(form.month).padStart(2, '0')}-${String(form.day).padStart(2, '0')}`,
      recorded_by: profile?.id,
      farm_id: form.farm_id || null,
      expense_category: form.expense_category || null,
      labor_type: form.labor_type || null,
    };

    if (editingId) {
      await supabase.from('expenses').update(payload).eq('id', editingId);
    } else {
      await supabase.from('expenses').insert(payload);
    }
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    setSaving(false);
    fetchData();
  };

  const handleEdit = (expense: Expense) => {
    setForm({
      year: expense.year, month: expense.month, day: expense.day || 1,
      sector_name: expense.sector_name || '', farm_id: expense.farm_id || '',
      season: expense.season || '', expense_category: expense.expense_category || '' as any,
      description: expense.description, labor_type: expense.labor_type || '' as any,
      worker_count: expense.worker_count || 0, fertilizer_name: expense.fertilizer_name || '',
      unit: expense.unit || '', quantity: expense.quantity || 0, unit_price: expense.unit_price || 0,
      expense_amount: expense.expense_amount, labor_cost: expense.labor_cost,
      fertilizer_cost: expense.fertilizer_cost, total_amount: expense.total_amount, notes: expense.notes || '',
    });
    setEditingId(expense.id);
    setShowModal(true);
  };

  const handleExport = () => {
    const csv = [
      ['السنة', 'الشهر', 'اليوم', 'المزرعة', 'التصنيف', 'البيان', 'المبلغ'].join(','),
      ...expenses.map(e => [e.year, e.month, e.day, (e.farm as any)?.name || '', e.expense_category || '', `"${e.description}"`, e.total_amount].join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expenses_${filterYear}.csv`; a.click();
  };

  const columns = [
    { key: 'date', header: 'التاريخ', render: (e: Expense) => `${e.year}/${e.month}/${e.day || '-'}` },
    { key: 'farm', header: 'المزرعة', render: (e: Expense) => (e.farm as any)?.name || e.sector_name || '-' },
    { key: 'expense_category', header: 'التصنيف', render: (e: Expense) => e.expense_category || '-' },
    { key: 'description', header: 'البيان', className: 'max-w-[200px] truncate' },
    { key: 'total_amount', header: 'المبلغ', render: (e: Expense) => (
      <span className="font-bold text-red-600">{formatCurrency(e.total_amount)}</span>
    )},
    { key: 'is_approved', header: 'الحالة', render: (e: Expense) => (
      <span className={`text-xs px-2 py-1 rounded-full ${e.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {e.is_approved ? 'معتمد' : 'قيد المراجعة'}
      </span>
    )},
  ];

  const totalAmount = expenses.reduce((s, e) => s + e.total_amount, 0);
  const years = Array.from({ length: 10 }, (_, i) => getCurrentYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المصروفات</h1>
          <p className="text-gray-500 mt-1">إجمالي: {formatCurrency(totalAmount)} ({expenses.length} سجل)</p>
        </div>
        {permissions?.canEditFinancials && (
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={18} />
            إضافة مصروف
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-xl border border-gray-200">
        <Filter size={16} className="text-gray-400" />
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value={0}>كل الشهور</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
          ))}
        </select>
        <select value={filterFarm} onChange={e => setFilterFarm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">كل المزارع</option>
          {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button onClick={handleExport} className="mr-auto flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
          <Download size={14} />
          تصدير CSV
        </button>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        searchKeys={['description', 'expense_category', 'sector_name']}
        actions={permissions?.canEditFinancials ? (exp) => (
          <button onClick={() => handleEdit(exp)} className="text-xs text-primary-600 hover:underline">تعديل</button>
        ) : undefined}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل مصروف' : 'إضافة مصروف جديد'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
              <select value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الشهر</label>
              <select value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اليوم</label>
              <input type="number" min={1} max={31} value={form.day} onChange={e => setForm({ ...form, day: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Farm + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المزرعة</label>
              <select value={form.farm_id} onChange={e => setForm({ ...form, farm_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">اختر المزرعة</option>
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع المصروف</label>
              <select value={form.expense_category} onChange={e => setForm({ ...form, expense_category: e.target.value as any })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">اختر النوع</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البيان *</label>
            <input type="text" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="وصف المصروف" />
          </div>

          {/* Labor section */}
          {form.expense_category === 'عماله' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع العمالة</label>
                <select value={form.labor_type} onChange={e => setForm({ ...form, labor_type: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">اختر النوع</option>
                  {LABOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عدد العمال</label>
                <input type="number" value={form.worker_count || ''} onChange={e => setForm({ ...form, worker_count: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          )}

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مصروف عام</label>
              <input type="number" step="0.01" value={form.expense_amount || ''} onChange={e => updateTotal({ expense_amount: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تكلفة عمالة</label>
              <input type="number" step="0.01" value={form.labor_cost || ''} onChange={e => updateTotal({ labor_cost: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تكلفة أسمدة/مبيدات</label>
              <input type="number" step="0.01" value={form.fertilizer_cost || ''} onChange={e => updateTotal({ fertilizer_cost: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <span className="font-medium text-gray-700">الإجمالي</span>
            <span className="text-xl font-bold text-red-600">{formatCurrency(form.total_amount)}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'حفظ'}
            </button>
            <button type="button" onClick={() => setShowModal(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
