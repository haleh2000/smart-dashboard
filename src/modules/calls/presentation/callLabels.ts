import type { BadgeTone } from '@/shared/ui';
import type { CallDirection, CallStatus } from '../domain/call';

interface Meta {
  label: string;
  tone: BadgeTone;
}

export const callStatusMeta: Record<CallStatus, Meta & { live: boolean }> = {
  ringing: { label: 'در حال زنگ', tone: 'warning', live: true },
  ongoing: { label: 'جاری', tone: 'info', live: true },
  answered: { label: 'پاسخ‌داده‌شده', tone: 'success', live: false },
  missed: { label: 'از دست رفته', tone: 'error', live: false },
};

export const callDirectionLabels: Record<CallDirection, string> = {
  inbound: 'ورودی',
  outbound: 'خروجی',
};

export const UNKNOWN_CALLER = 'ناشناس';
export const UNCATEGORIZED = 'دسته‌بندی‌نشده';
