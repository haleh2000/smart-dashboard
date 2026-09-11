import type { Permission, Role } from '@/modules/auth';
import type { BadgeTone } from '@/shared/ui';
import type { RoleDefinition, RoleErrorCode } from '../domain/roleDefinition';
import type { IntegrationId, IntegrationStatus, SettingsField } from '../domain/settings';
import type { StaffUserErrorCode } from '../domain/staffUser';

/** README → «یکپارچه‌سازی‌های اصلی (Integrations)». */
export const integrationMeta: Record<IntegrationId, { name: string; description: string }> = {
  crm: { name: 'CRM', description: 'اطلاعات مشتری و تعاملات؛ منبع اصلی تیکت‌ها' },
  coreInsurance: {
    name: 'Core Insurance Systems',
    description: 'اطلاعات بیمه‌نامه، خسارت و داده‌های بیمه‌ای',
  },
  callCenter: { name: 'Call Center (سیتاک)', description: 'دریافت و مدیریت اطلاعات تماس' },
  voices: { name: 'Voices', description: 'فایل و سوابق مکالمات صوتی' },
  ai: {
    name: 'AI Services',
    description: 'تحلیل احساسات، تشخیص موضوع و برچسب‌گذاری خودکار',
  },
};

export const integrationStatusMeta: Record<IntegrationStatus, { label: string; tone: BadgeTone }> =
  {
    connected: { label: 'متصل', tone: 'success' },
    degraded: { label: 'اختلال', tone: 'warning' },
    disconnected: { label: 'قطع', tone: 'error' },
  };

export const roleTones: Record<Role, BadgeTone> = {
  agent: 'info',
  supervisor: 'warning',
  admin: 'success',
};

/** Permission checklist groups in the role form, with a one-line hint per permission. */
export const permissionGroups: readonly { title: string; permissions: readonly Permission[] }[] = [
  { title: 'عمومی', permissions: ['dashboard.view', 'tickets.view', 'customers.view'] },
  { title: 'تماس‌ها', permissions: ['calls.view', 'calls.receive'] },
  { title: 'مدیریت', permissions: ['admin.manage'] },
];

export const permissionHints: Record<Permission, string> = {
  'dashboard.view': 'KPIها، نمودارها، هیت‌مپ و تحلیل احساسات',
  'tickets.view': 'لیست و جزئیات تیکت‌های CRM، یادداشت‌ها و خروجی Excel',
  'customers.view': 'اطلاعات هویتی، بیمه‌نامه‌ها، خسارت‌ها و سوابق تعامل',
  'calls.view': 'لیست تماس‌ها، فایل صوتی، متن مکالمه و تحلیل AI',
  'calls.receive': 'پنجره تماس ورودی و ثبت موضوع سه‌سطحی',
  'admin.manage': 'کاربران، نقش‌ها، تنظیمات و Integrationها',
};

export const roleErrorMessages: Record<RoleErrorCode, string> = {
  required: 'نام نقش الزامی است.',
  tooLong: 'نام نقش حداکثر ۴۰ نویسه است.',
  duplicate: 'نقشی با این نام وجود دارد.',
  noPermission: 'حداقل یک دسترسی انتخاب کنید.',
};

export const roleToneOf = (role: Pick<RoleDefinition, 'system' | 'baseRole'>): BadgeTone =>
  role.system && role.baseRole ? roleTones[role.baseRole] : 'neutral';

export const activeMeta = {
  active: { label: 'فعال', tone: 'success' as BadgeTone },
  inactive: { label: 'غیرفعال', tone: 'neutral' as BadgeTone },
};

export const userErrorMessages: Record<StaffUserErrorCode, string> = {
  required: 'این فیلد الزامی است.',
  invalidMobile: 'شماره موبایل را به شکل ۰۹۱۲۱۲۳۴۵۶۷ وارد کنید.',
  invalidEmail: 'ایمیل معتبر نیست.',
};

export const duplicateMobileMessage = 'کاربر دیگری با این شماره موبایل ثبت شده است.';

export const settingsLabels: Record<SettingsField, { label: string; hint?: string }> = {
  slaDays: { label: 'SLA پیش‌فرض تیکت (روز کاری)' },
  defaultPageSize: { label: 'تعداد ردیف در هر صفحه' },
  negativeSentimentAlert: {
    label: 'آستانه هشدار احساس منفی (درصد)',
    hint: 'اگر سهم مکالمات منفی از این مقدار بیشتر شود، به سرپرست‌ها هشدار داده می‌شود.',
  },
  repeatCallThreshold: {
    label: 'آستانه تماس تکراری (در ۷ روز)',
    hint: 'مشتری با تماس بیش از این تعداد، تماس‌گیرنده تکراری محسوب می‌شود.',
  },
  incomingCallPopup: { label: 'نمایش Popup تماس ورودی برای اپراتورها' },
  autoTagging: { label: 'برچسب‌گذاری خودکار (Auto Tagging)' },
  transcription: { label: 'پیاده‌سازی متن مکالمات (Transcript)' },
  voiceRetentionDays: { label: 'مدت نگهداری فایل‌های صوتی (روز)' },
};
