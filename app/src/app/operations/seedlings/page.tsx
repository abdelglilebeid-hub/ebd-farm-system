'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber } from '@/lib/utils';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { Plus, Sprout, TrendingDown, TrendingUp, Package } from 'lucide-react';

export default function SeedlingsPage() {
  const { profile, permissions } = useAuth();
  const supabase = createClient();
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ planted: 0, sold: 0, remaining: 0 });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    year: new Date().getFullYear(), description: '', category: 'planted',
    quantity: 0, location: '', recipient: '', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('seedling_inventory').select('*')
      .order('year', { ascending: false }).order('created_at', { ascending: false });
    setRecords(data || []);

    const planted = (data || []).filter(r => r.category === 'planted').reduce((s, r) => s + r.quantity, 0);
    const sold = (data || []).filter(r => r.category === 'sold').reduce((s, r) => s + r.quantity, 0);
    const transferred = (data || []).filter(r => ['transferred', 'gifted'].includes(r.category)).reduce((s, r) => s + r.quantity, 0);

    setSummary({ planted, sold, remaining: planted - sold - transferred });
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('seedling_inventory').insert({
      ...form, recorded_by: profile?.id, record_date: new Date().toISOString().split('T')[0],
    });
    setShowModal(false); setForm(emptyForm); setSaving(false);
    fetchData();
  };

  const categoryLabels: Record<string, string> = {
    planted: 'زراعة', sold: 'بيع', transferred: 'ترقيع', grafted: 'تطعيم', gifted: 'هدية',
  };
  const categoryColors: Record<string, string> = {
    planted: 'bg-green-100 text-green-700',
    sold: 'bg-blue-100 text-blue-700',
    transferred: 'bg-yellow-100 text-yellow-700',
    grafted: 'bg-purple-100 text-purple-700',
    gifted: 'bg-pink-100 text-pink-700',
  };

  const columns = [
    { key: 'year', header: 'العام' },
    { key: 'category', header: 'النوع', render: (r: any) => (
      <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[r.category] || ''}`}>
        {categoryLabels[r.category] || r.category}
      </span>
    )},
    { key: 'description', header: 'البيان' },
    { key: 'quantity', header: 'العدد', render: (r: any) => <span className="font-bold">{formatNumber(r.quantity)}</span> },
    { key: 'location', header: 'الموقع', render: (r: any) => r.location || '-' },
    { key: 'recipient', header: 'المستلم', render: (r: any) => r.recipient || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">جرد الفسائل</h1>
          <p className="text-gray-500 mt-1">مزرعة 22 فدان بالعزبة</p>
        </div>
        {permissions?.canManageFarms && (
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg">
            <Plus size={18} /> تسجيل حركة
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <Sprout className="w-8 h-8 text-green-700 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-800">{formatNumber(summary.planted)}</p>
          <p className="text-sm text-green-600">فسائل مزروعة</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <TrendingDown className="w-8 h-8 text-blue-700 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-800">{formatNumber(summary.sold)}</p>
          <p className="text-sm text-blue-600">فسائل مباعة</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
          <Package className="w-8 h-8 text-yellow-700 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-800">{formatNumber(summary.remaining)}</p>
          <p className="text-sm text-yellow-600">الرصيد المتبقي</p>
        </div>
      </div>

      <DataTable columns={columns} data={records} searchKeys={['description', 'location', 'recipient']} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="تسجيل حركة فسائل" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العام</label>
              <input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="planted">زراعة</option>
                <option value="sold">بيع</option>
                <option value="transferred">ترقيع</option>
                <option value="grafted">تطعيم</option>
                <option value="gifted">هدية</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البيان *</label>
            <input type="text" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العدد *</label>
              <input type="number" required min={1} value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button type="button" onClick={() => setShowModal(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
