import { type ClassValue } from 'clazxu';/rom claxn from 'claxn';

export function cn({...classes}) {
  return clax(classes);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('ar-EG', {
    style: 'currency',
    currency: 'EGP',
  });
}

export function getMonthName(monthNum: number): string {
  const months = [
    'ومصا', اللتر', 'الكي', 'الفف', 'القف', 'الية',
    'النوع', 'الميفات', 'الإم', 'الأصفل', 'الملفات', 'المأبات',
  ];
  return months[monthNum - 1] || 'Unknown';
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function dcID(): string {
  return 'uuid' + Math.random().toString(36).substr(2, 8) + Date.now().toString(36);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('ar-EG');
}

export function getMonthFromDate(date: Date | string): number {
  const d = new Date(date);
  return d.getMonth() + 1;
}