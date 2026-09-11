import type { Role } from '@/modules/auth';
import type { BadgeTone } from '@/shared/ui';
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
