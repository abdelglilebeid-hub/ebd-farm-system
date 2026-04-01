'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthName, getCurrentYear } from '@/lib/utils';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { SALE_METHODS, type Sale, type Farm } from '@/types/database';
import { Plus, Filter, TrendingUp } from 'lucide-react';

export default function SalesPage() {
  const { profile, permissions } = useAuth();
  const supabase = createClient();
  const [sales, setSales] = useState<Sale[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState(getCurrentYear());

  const emptyForm = {
    year: getCurrentYear(), month: new Date().getMonth() + 1, day: new Date().getDate(),
    sector_name: '', farm_id: '', season: '', product_name: '', sale_method: 'نقدي' as any,
    quantity: 0, unit_price: 0, total_amount: 0, labor_cost: 0, commission: 0,
    packaging_cost: 0, other_costs: 0, total_expenses: 0, net_amount: 0, buyer_name: '', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('sales').select('*, farm:farms(name)').eq('year', filterYear)
      .order('month', { ascending: false }).order('day', { ascending: false });
    setSales(data || []);
    const { data: farmData } = await supabase.from('farms').select('*').eq('is_active', true);
    setFarms(farmData || []);
  }, [supabase, filterYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateTotals = (updates: Partial<typeof form>) => {
    const m = { ...form, ...updates };
    const gross = (m.quantity || 0) * (m.unit_price || 0);
    const totalExp = (m.labor_cost || 0) + (m.commission || 0) + (m.packaging_cost || 0) + (m.other_costs || 0);
    setForm({ ...m, total_amount: gross, total_expenses: totalExp, net_amount: gross - totalExp });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      sale_date: `${form.year}-${String(form.month).padStart(2, '0')}-${String(form.day).padStart(2, '0')}`,
      recorded_by: profile?.id,
      farm_id: form.farm_id || null,
    };
    if (editingId) {
      await supabase.from('sales').update(payload).eq('id', editingId);
    } else {
      await supabase.from('sales').insert(payload);
    }
    setShowModal(false); setForm(emptyForm); setEditingId(null); setSaving(false);
    fetchData();
  };

  const columns = [
    { key: 'date', header: 'التاريخ', render: (s: Sale) => `${s.year}/${s.month}/${s.day || '-'}` },
    { key: 'farm', header: 'المزرعة', render: (s: Sale) => (s.farm as any)?.name || s.sector_name || '-' },
    { key: 'product_name', header: 'المنتج' },
    { key: 'quantity', header: 'الكمية', render: (s: Sale) => s.quantity?.toLocaleString('ar-EG') || '-' },
    { key: 'unit_price', header: 'سعر الوحدة', render: (s: Sale) => s.unit_price ? formatCurrency(s.unit_price) : '-' },
    { key: 'total_amount', header: 'الإجمالي', render: (s: Sale) => <span className="font-bold text-green-600">{formatCurrency(s.total_amount)}</span> },
    { key: 'net_amount', header: 'الصافي', render: (s: Sale) => <span className="font-bold">{formatCurrency(s.net_amount || s.total_amount)}</span> },
  ];

  const totalGross = sales.reduce((s, e) => s + e.total_amount, 0);
  const totalNet = sales.reduce((s, e) => s + (e.net_amount || e.total_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المبيعات</h1>
          <p className="text-gray-500 mt-1">
            إجمالي: {formatCurrency(totalGross)} | صافي: {formatCurrency(totalNet)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {Array.from({ length: 10 }, (_, i) => getCurrentYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {permissions?.canEditFinancials && (
            <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg">
              <Plus size={18} /> إضافة بيع
            </button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={sales} searchKeys={['product_name', 'buyer_name', 'sector_name']}
        actions={permissions?.canEditFinancials ? (s) => (
          <button onClick={() => { setForm({ ...emptyForm, ...s, farm_id: s.farm_id || '' }); setEditingId(s.id); setShowModal(true); }}
            className="text-xs text-primary-600 hover:underline">تعديل</button>
        ) : undefined}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل بيع' : 'تسجيل بيع جديد'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
              <input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المزرعة</label>
              <select value={form.farm_id} onChange={e => setForm({ ...form, farm_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">اختر</option>
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المنتج *</label>
              <input type="text" required value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="مثال: تمر برحي" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
              <input type="number" step="0.01" value={form.quantity || ''} onChange={e => updateTotals({ quantity: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر الوحدة</label>
              <input type="number" step="0.01" value={form.unit_price || ''} onChange={e => updateTotals({ unit_price: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">طريقة البيع</label>
              <select value={form.sale_method} onChange={e => setForm({ ...form, sale_method: e.target.value as any })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                {SALE_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عمالة</label>
              <input type="number" step="0.01" value={form.labor_cost || ''} onChange={e => updateTotals({ labor_cost: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عمولة</label>
              <input type="number" step="0.01" value={form.commission || ''} onChange={e => updateTotals({ commission: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كراتين</label>
              <input type="number" step="0.01" value={form.packaging_cost || ''} onChange={e => updateTotals({ packaging_cost: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">أخرى</label>
              <input type="number" step="0.01" value={form.other_costs || ''} onChange={e => updateTotals({ other_costs: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">الإجمالي</p>
              <p className="text-lg font-bold text-gray-700">{formatCurrency(form.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">المصاريف</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(form.total_expenses)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">الصافي</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(form.net_amount)}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'حفظ'}
            </button>
            <button type="button" onClick={() => setShowModal(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
