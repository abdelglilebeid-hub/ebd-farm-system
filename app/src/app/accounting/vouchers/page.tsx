'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthName, getCurrentYear } from '@/lib/utils';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import type { PaymentVoucher, Farm } from '@/types/database';
import { Plus, CheckCircle, Clock } from 'lucide-react';

export default function VouchersPage() {
  const { profile, permissions } = useAuth();
  const supabase = createClient();
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    employee_name: '', role_description: '', farm_id: '', amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_month: new Date().getMonth() + 1,
    payment_year: getCurrentYear(),
    payment_type: 'salary', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('payment_vouchers').select('*, farm:farms(name)')
      .order('created_at', { ascending: false });
    setVouchers(data || []);
    const { data: farmData } = await supabase.from('farms').select('*');
    setFarms(farmData || []);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('payment_vouchers').insert({
      ...form, farm_id: form.farm_id || null, approved_by: profile?.id,
    });
    setShowModal(false); setForm(emptyForm); setSaving(false);
    fetchData();
  };

  const togglePaid = async (id: string, isPaid: boolean) => {
    await supabase.from('payment_vouchers').update({ is_paid: !isPaid }).eq('id', id);
    fetchData();
  };

  const paymentTypes: Record<string, string> = {
    salary: 'مرتب', bonus: 'مكافأة', advance: 'سلفة', reimbursement: 'تعويض',
  };

  const columns = [
    { key: 'employee_name', header: 'الاسم' },
    { key: 'role_description', header: 'الوظيفة' },
    { key: 'farm', header: 'المزرعة', render: (v: any) => v.farm?.name || '-' },
    { key: 'amount', header: 'المبلغ', render: (v: PaymentVoucher) => <span className="font-bold">{formatCurrency(v.amount)}</span> },
    { key: 'payment_type', header: 'النوع', render: (v: PaymentVoucher) => paymentTypes[v.payment_type] || v.payment_type },
    { key: 'payment_date', header: 'التاريخ' },
    {
      key: 'is_paid', header: 'الحالة', render: (v: PaymentVoucher) => (
        <button onClick={() => permissions?.canEditFinancials && togglePaid(v.id, v.is_paid)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            v.is_paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          } ${permissions?.canEditFinancials ? 'cursor-pointer hover:opacity-80' : ''}`}>
          {v.is_paid ? <><CheckCircle size={12} /> تم الدفع</> : <><Clock size={12} /> معلق</>}
        </button>
      )
    },
  ];

  const totalPaid = vouchers.filter(v => v.is_paid).reduce((s, v) => s + v.amount, 0);
  const totalPending = vouchers.filter(v => !v.is_paid).reduce((s, v) => s + v.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">اذونات الصرف</h1>
          <p className="text-gray-500 mt-1">
            مدفوع: {formatCurrency(totalPaid)} | معلق: {formatCurrency(totalPending)}
          </p>
        </div>
        {permissions?.canEditFinancials && (
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg">
            <Plus size={18} /> إضافة إذن صرف
          </button>
        )}
      </div>

      <DataTable columns={columns} data={vouchers} searchKeys={['employee_name', 'role_description']} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة إذن صرف" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الموظف *</label>
            <input type="text" required value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوظيفة</label>
            <input type="text" value={form.role_description} onChange={e => setForm({ ...form, role_description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label>
              <input type="number" required step="0.01" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="salary">مرتب</option>
                <option value="bonus">مكافأة</option>
                <option value="advance">سلفة</option>
                <option value="reimbursement">تعويض</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المزرعة</label>
              <select value={form.farm_id} onChange={e => setForm({ ...form, farm_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">عام</option>
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
              <input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })}
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
