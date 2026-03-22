'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types/database';
import { Users, Shield, Bell, Database } from 'lucide-react';

export default function SettingsPage() {
  const { profile, isOwner } = useAuth();
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    setUsers(data || []);
  }, [supabase]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateRole = async (userId: string, role: string) => {
    setSaving(true);
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setSaving(false);
    fetchUsers();
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId);
    fetchUsers();
  };

  const roleLabels: Record<string, string> = {
    owner: 'مالك', accountant: 'محاسب', manager: 'مدير مزرعة', worker: 'عامل',
  };

  if (!isOwner) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-600">غير مصرح</h2>
        <p className="text-gray-400 mt-2">هذه الصفحة متاحة للمالك فقط</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">الإعدادات</h1>
        <p className="text-gray-500 mt-1">إدارة المستخدمين والنظام</p>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
          <Users size={18} /> إدارة المستخدمين
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="font-medium">{user.full_name}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={e => updateRole(user.id, e.target.value)}
                      disabled={user.id === profile?.id}
                      className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      {Object.entries(roleLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td>
                    {user.id !== profile?.id && (
                      <button
                        onClick={() => toggleActive(user.id, user.is_active)}
                        className={`text-xs px-3 py-1 rounded ${
                          user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
          <Shield size={18} /> صلاحيات الأدوار
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الصلاحية</th>
                <th>مالك</th>
                <th>محاسب</th>
                <th>مدير مزرعة</th>
                <th>عامل</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['عرض الماليات', true, true, true, false],
                ['تعديل الماليات', true, true, true, false],
                ['إدارة المزارع', true, false, true, false],
                ['إدارة المستخدمين', true, false, false, false],
                ['اعتماد المصروفات', true, true, false, false],
                ['حذف السجلات', true, false, false, false],
                ['عرض التقارير', true, true, true, false],
                ['إدارة المهام', true, false, true, false],
              ].map(([label, ...perms], i) => (
                <tr key={i}>
                  <td className="font-medium">{label as string}</td>
                  {(perms as boolean[]).map((p, j) => (
                    <td key={j} className="text-center">
                      {p ? <span className="text-green-600">✓</span> : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
