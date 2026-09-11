import type { Permission } from '../domain/permission';
import type { Role } from '../domain/role';

export const roleLabels: Record<Role, string> = {
  agent: 'اپراتور',
  supervisor: 'سرپرست',
  admin: 'مدیر',
};

/** README → «نقش‌های کاربری (RBAC)». */
export const roleDescriptions: Record<Role, string> = {
  agent: 'پاسخ به تماس، مشاهده اطلاعات مشتری، پیگیری تیکت و استفاده از پیشنهادهای AI',
  supervisor: 'مانیتورینگ اپراتورها، مدیریت صف، بررسی SLA، کنترل کیفیت و گزارش‌گیری',
  admin: 'مدیریت کاربران و دسترسی‌ها، سناریوها و قوانین، گزارش‌های کلان و تنظیمات سیستم',
};

export const permissionLabels: Record<Permission, string> = {
  'dashboard.view': 'داشبورد، Analytics و گزارش‌ها',
  'tickets.view': 'مشاهده و پیگیری تیکت‌ها',
  'calls.view': 'مشاهده تماس‌ها، فایل صوتی و تحلیل AI',
  'calls.receive': 'دریافت Popup تماس ورودی و دسته‌بندی سه‌سطحی',
  'customers.view': 'پروفایل مشتری (Customer 360)',
  'admin.manage': 'مدیریت کاربران، دسترسی‌ها و تنظیمات سیستم',
};
