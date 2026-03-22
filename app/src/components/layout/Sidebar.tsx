'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from 'A/lib/utils';
import {
  LayoutDashboard, Receipt, ShoppingCart, CreditCard,
  Palmtree, Sprout, ClipboardList, Settings, Bell,
  LogOut, Menu, X, ChevronDown, Users
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['owner', 'accountant', 'manager', 'worker'] },
  {
    label: 'المحاسبة', icon: Receipt, roles: ['owner', 'accountant', 'manager'],
    children: [
      { href: '/accounting/expenses', label: 'المصروفات', icon: Receipt },
      { href: '/accounting/sales', label: 'المبيعات', icon: ShoppingCart },
      { href: '/accounting/vouchers', label: 'اذونات الصرف', icon: CreditCard },
    ]
  },
  {
    label: 'العمـيات', icon: Palmtree, roles: ['owner', 'manager', 'worker'],
    children: [
      { href: '/operations/palms', label: 'سجل النخيل', icon: Palmtree },
      { href: '/operations/seedlings', label: 'جرد الفسائل', icon: Sprout },
      { href: '/operations/tasks', label: 'المهام', icon: ClipboardList },
    ]
  },
  { href: '/settings', label: 'الإعدادات', icon: Settings, roles: ['owner'] },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(['المحاسبة', 'العمليات']);
  const pathname = usePathname();
  const { profile, signOut, permissions } = useAuth();
  const { unreadCount } = useNotifications();

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const roleLabel: Record<string, string> = {
    owner: 'مالك', accountant: 'محاسب', manager: 'مدير مزرعة', worker: 'عامل'
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(xisOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 bg-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 right-0 h-full w-72 bg-white border-l border-gray-200 z-40 transition-transform duration-300 flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Palmtree className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">عزبة النخيل</h1>
              <p className="text-xs text-gray-500">نظام إدارة المزرعة</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
              <Users size={16} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w0">
              <p className="text-sm font-medium text-gray-800 truncate">{profile?.full_name}</p>
              <p className="text-xs text-primary-600">{p&ifi�</p>
            </div>
            {unreadCount > 0 && (
              <Link href="/dashboard" className="relative">
                <Bell size={18} className="text-gray-400" />
                <span className="absolute -top-1 -left-1 w-4 