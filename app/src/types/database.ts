export type UserRole = 'owner' | 'accountant' | 'manager' | 'worker';

export type ExpenseCategory =
  | 'صيانه و ايجار ميكنه' | 'ضيافه' | 'مشتريات' | 'مرتبات' | 'مسحوبات'
  | 'عماله' | 'اخري' | 'اسمده ومبيدات' | 'البنجر' | 'مباني'
  | 'الثوم' | 'القمح' | 'الارز' | 'النخيل' | 'ابراج الحمام'
  | 'جنينه البلد' | 'كهرباء' | 'ايجار ارض' | 'رى' | 'عنب'
  | 'الموالح' | 'القشطه' | 'الكمثري' | 'موسميه' | 'نقل' | 'خدمات';

export type LaborType =
  | 'رش' | 'نظافه عناقيد' | 'حشائش' | 'شيل نواشف' | 'فرز خشب'
  | 'لم ثمار' | 'عمل جور' | 'تشعيب' | 'ولد لام ثمار' | 'جمع ليمون'
  | 'زراعه ثوم راجل' | 'زراعه ثوم ولد' | 'حفر وتنزيل خدمه'
  | 'غسيل خراطيم' | 'لم قص' | 'دهان شجره' | 'شيل سرطانات'
  | 'تقليم' | 'تأبير' | 'تنظيف عراجين' | 'حصاد' | 'اخري';

export type SaleMethod = 'نقدي' | 'آجل' | 'شيك' | 'تحويل';
export type NotificationType = 'budget_alert' | 'task_due' | 'payment_due' | 'inventory_low' | 'general';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sector {
  id: string;
  name: string;
  name_en?: string;
  area_feddan?: number;
  description?: string;
}

export interface Farm {
  id: string;
  sector_id?: string;
  name: string;
  area_feddan?: number;
  area_qirat?: number;
  farm_type?: string;
  planting_date?: string;
  season?: string;
  is_active: boolean;
  sector?: Sector;
}

export interface Hawsha {
  id: string;
  farm_id: string;
  name: string;
  area_feddan?: number;
  area_qirat?: number;
  palm_count_barhi: number;
  palm_count_male: number;
  spacing?: string;
  planting_date?: string;
  notes?: string;
  farm?: Farm;
}

export interface Expense {
  id: string;
  year: number;
  month: number;
  day?: number;
  expense_date?: string;
  sector_name?: string;
  farm_id?: string;
  season?: string;
  expense_category?: ExpenseCategory;
  description: string;
  labor_type?: LaborType;
  worker_count?: number;
  fertilizer_name?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  expense_amount: number;
  labor_cost: number;
  fertilizer_cost: number;
  total_amount: number;
  recorded_by?: string;
  approved_by?: string;
  is_approved: boolean;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  farm?: Farm;
}

export interface Sale {
  id: string;
  year: number;
  month: number;
  day?: number;
  sale_date?: string;
  sector_name?: string;
  farm_id?: string;
  season?: string;
  product_name: string;
  sale_method: SaleMethod;
  quantity?: number;
  unit_price?: number;
  total_amount: number;
  labor_cost: number;
  commission: number;
  packaging_cost: number;
  other_costs: number;
  total_expenses: number;
  net_amount?: number;
  buyer_name?: string;
  recorded_by?: string;
  notes?: string;
  created_at: string;
  farm?: Farm;
}

export interface PaymentVoucher {
  id: string;
  employee_name: string;
  role_description?: string;
  farm_id?: string;
  amount: number;
  payment_date: string;
  payment_month?: number;
  payment_year?: number;
  payment_type: string;
  notes?: string;
  approved_by?: string;
  is_paid: boolean;
  farm?: Farm;
}

export interface FarmTask {
  id: string;
  title: string;
  description?: string;
  farm_id?: string;
  hawsha_id?: string;
  task_type?: string;
  assigned_to?: string;
  due_date?: string;
  completed_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  worker_count?: number;
  labor_cost?: number;
  materials_used?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  farm?: Farm;
  assignee?: Profile;
}

export interface SeedlingInventory {
  id: string;
  year: number;
  farm_id?: string;
  description: string;
  category: string;
  quantity: number;
  location?: string;
  recipient?: string;
  notes?: string;
  recorded_by?: string;
  record_date: string;
  farm?: Farm;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface DashboardStats {
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  totalPalms: number;
  activeTasks: number;
  pendingPayments: number;
  unreadNotifications: number;
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, {
  label: string;
  canViewFinancials: boolean;
  canEditFinancials: boolean;
  canManageFarms: boolean;
  canManageUsers: boolean;
  canApproveExpenses: boolean;
  canDeleteRecords: boolean;
  canViewReports: boolean;
  canManageTasks: boolean;
}> = {
  owner: {
    label: 'مالك',
    canViewFinancials: true,
    canEditFinancials: true,
    canManageFarms: true,
    canManageUsers: true,
    canApproveExpenses: true,
    canDeleteRecords: true,
    canViewReports: true,
    canManageTasks: true,
  },
  accountant: {
    label: 'محاسب',
    canViewFinancials: true,
    canEditFinancials: true,
    canManageFarms: false,
    canManageUsers: false,
    canApproveExpenses: true,
    canDeleteRecords: false,
    canViewReports: true,
    canManageTasks: false,
  },
  manager: {
    label: 'مدير مزرعة',
    canViewFinancials: true,
    canEditFinancials: true,
    canManageFarms: true,
    canManageUsers: false,
    canApproveExpenses: false,
    canDeleteRecords: false,
    canViewReports: true,
    canManageTasks: true,
  },
  worker: {
    label: 'عامل',
    canViewFinancials: false,
    canEditFinancials: false,
    canManageFarms: false,
    canManageUsers: false,
    canApproveExpenses: false,
    canDeleteRecords: false,
    canViewReports: false,
    canManageTasks: false,
  },
};

// Constants for dropdown options
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'صيانه و ايجار ميكنه', 'ضيافه', 'مشتريات', 'مرتبات', 'مسحوبات',
  'عماله', 'اخري', 'اسمده ومبيدات', 'البنجر', 'مباني',
  'الثوم', 'القمح', 'الارز', 'النخيل', 'ابراج الحمام',
  'جنينه البلد', 'كهرباء', 'ايجار ارض', 'رى', 'عنب',
  'الموالح', 'القشطه', 'الكمثري', 'موسميه', 'نقل', 'خدمات'
];

export const LABOR_TYPES: LaborType[] = [
  'رش', 'نظافه عناقيد', 'حشائش', 'شيل نواشف', 'فرز خشب',
  'لم ثمار', 'عمل جور', 'تشعيب', 'ولد لام ثمار', 'جمع ليمون',
  'زراعه ثوم راجل', 'زراعه ثوم ولد', 'حفر وتنزيل خدمه',
  'غسيل خراطيم', 'لم قص', 'دهان شجره', 'شيل سرطانات',
  'تقليم', 'تأبير', 'تنظيف عراجين', 'حصاد', 'اخري'
];

export const SALE_METHODS: SaleMethod[] = ['نقدي', 'آجل', 'شيك', 'تحويل'];

export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
