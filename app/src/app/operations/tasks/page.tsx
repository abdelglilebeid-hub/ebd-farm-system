'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import type { FarmTask, Farm } from '@/types/database';
import { Plus, CheckCircle, Clock, AlertTriangle, Circle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { profile, permissions } = useAuth();
  const supabase = createClient();
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    title: '', description: '', farm_id: '', task_type: '',
    due_date: '', priority: 'medium' as const, worker_count: 0,
    labor_cost: 0, materials_used: '', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    let query = supabase.from('farm_tasks').select('*, farm:farms(name)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setTasks(data || []);
    const { data: farmData } = await supabase.from('farms').select('*');
    setFarms(farmData || []);
  }, [supabase, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form, farm_id: form.farm_id || null, due_date: form.due_date || null,
      created_by: profile?.id,
    };
    if (editingId) {
      await supabase.from('farm_tasks').update(payload).eq('id', editingId);
    } else {
      await supabase.from('farm_tasks').insert(payload);
    }
    setShowModal(false); setForm(emptyForm); setEditingId(null); setSaving(false);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'completed') updates.completed_date = new Date().toISOString().split('T')[0];
    await supabase.from('farm_tasks').update(updates).eq('id', id);
    fetchData();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress': return <Clock size={16} className="text-yellow-500" />;
      case 'cancelled': return <Circle size={16} className="text-gray-400" />;
      default: return <Circle size={16} className="text-blue-400" />;
    }
  };

  const statusLabel: Record<string, string> = {
    pending: 'قيد الانتظار', in_progress: 'جاري التنفيذ', completed: 'مكتملة', cancelled: 'ملغاة',
  };
  const priorityLabel: Record<string, string> = {
    low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة',
  };
  const priorityColor: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-yellow-100 text-yellow-700',
    urgent: 'bg-red-100 text-red-700',
  };
  const taskTypes: Record<string, string> = {
    irrigation: 'ري', fertilizing: 'تسميد', spraying: 'رش', harvesting: 'حصاد',
    maintenance: 'صيانة', planting: 'زراعة', pruning: 'تقليم', other: 'أخرى',
  };

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المهام والعمليات</h1>
          <p className="text-gray-500 mt-1">{counts.pending} قيد الانتظار | {counts.in_progress} جاري التنفيذ</p>
        </div>
        {permissions?.canManageTasks && (
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg">
            <Plus size={18} /> مهمة جديدة
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'الكل' },
          { key: 'pending', label: 'قيد الانتظار' },
          { key: 'in_progress', label: 'جاري التنفيذ' },
          { key: 'completed', label: 'مكتملة' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === f.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}>
            {f.label} ({counts[f.key as keyof typeof counts] || 0})
          </button>
        ))}
      </div>

      {/* Task Cards */}
      <div className="grid gap-3">
        {tasks.map(task => (
          <div key={task.id} className={cn(
            'bg-white rounded-xl border p-4 transition-colors hover:shadow-sm',
            task.status === 'completed' ? 'border-green-200 opacity-75' : 'border-gray-200'
          )}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{statusIcon(task.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn('font-medium', task.status === 'completed' && 'line-through text-gray-400')}>
                    {task.title}
                  </h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', priorityColor[task.priority])}>
                    {priorityLabel[task.priority]}
                  </span>
                  {task.task_type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {taskTypes[task.task_type] || task.task_type}
                    </span>
                  )}
                </div>
                {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  {(task.farm as any)?.name && <span>📍 {(task.farm as any).name}</span>}
                  {task.due_date && <span>📅 {formatDate(task.due_date)}</span>}
                </div>
              </div>
              {permissions?.canManageTasks && task.status !== 'completed' && (
                <div className="flex gap-1">
                  {task.status === 'pending' && (
                    <button onClick={() => updateStatus(task.id, 'in_progress')}
                      className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100">
                      بدء
                    </button>
                  )}
                  <button onClick={() => updateStatus(task.id, 'completed')}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                    إتمام
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400">لا توجد مهام</p>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل مهمة' : 'مهمة جديدة'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المهمة *</label>
            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع المهمة</label>
              <select value={form.task_type} onChange={e => setForm({ ...form, task_type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">اختر</option>
                {Object.entries(taskTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                {Object.entries(priorityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
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
