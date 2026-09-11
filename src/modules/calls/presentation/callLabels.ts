import type { BadgeTone } from '@/shared/ui';
import type { SentimentShift } from '@/shared/domain/insights';
import type { CallDirection, CallStatus, SubjectAgreement } from '../domain/call';

/** Operator vs. AI subject detection. */
export const agreementMeta: Record<SubjectAgreement, Meta> = {
  match: { label: 'تطابق کامل', tone: 'success' },
  partial: { label: 'تطابق موضوع اصلی', tone: 'warning' },
  mismatch: { label: 'عدم تطابق', tone: 'error' },
  pending: { label: 'در انتظار دسته‌بندی اپراتور', tone: 'info' },
};

export const shiftMeta: Record<SentimentShift, Meta> = {
  improved: { label: 'بهبود', tone: 'success' },
  unchanged: { label: 'بدون تغییر', tone: 'neutral' },
  worsened: { label: 'بدتر شد', tone: 'error' },
};

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
