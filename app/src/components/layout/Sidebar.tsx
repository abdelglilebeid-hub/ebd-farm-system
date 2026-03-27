'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
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
    label: 'العمليات', icon: Palmtree, roles: ['owner', 'manager', 'worker'],
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
        onClick={() => setIsOpen(!isOpen)}
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{profile?.full_name}</p>
              <p className="text-xs text-primary-600">{profile?.role ? roleLabel[profile.role] : ''}</p>
            </div>
            {unreadCount > 0 && (
              <Link href="/dashboard" className="relative">
                <Bell size={18} className="text-gray-400" />
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            if (profile?.role && !item.roles?.includes(profile.role)) return null;

            if (item.children) {
              const isExpanded = openMenus.includes(item.label);
              const isActive = item.children.some(c => pathname.startsWith(c.href));

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <item.icon size={18} />
                    <span className="flex-1 text-right font-medium">{item.label}</span>
                    <ChevronDown size={16} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                  </button>
                  {isExpanded && (
                    <div className="mr-5 mt-1 space-y-1 border-r-2 border-gray-100 pr-3">
                      {item.children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                            pathname === child.href
                              ? 'text-primary-700 bg-primary-50 font-medium'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <child.icon size={16} />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  pathname === item.href
                    ? 'text-primary-700 bg-primary-50 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
