import type { BadgeTone } from '@/shared/ui';
import type {
  NoteError,
  TicketEventKind,
  TicketStatus,
  TicketStatusFilter,
} from '../domain/ticket';

interface Meta {
  label: string;
  tone: BadgeTone;
}

export const statusMeta: Record<TicketStatus, Meta & { live: boolean }> = {
  pending: { label: 'در انتظار', tone: 'error', live: true },
  inProgress: { label: 'در جریان', tone: 'warning', live: true },
  registered: { label: 'ثبت‌شده', tone: 'neutral', live: false },
  underReview: { label: 'در رسیدگی', tone: 'success', live: true },
  referred: { label: 'ارجاع‌شده', tone: 'success', live: false },
  closed: { label: 'بسته‌شده', tone: 'neutral', live: false },
};

export const statusGroupLabels: Record<'open' | 'inReview', string> = {
  open: 'باز (غیر بسته‌شده)',
  inReview: 'در حال بررسی',
};

export const statusFilterLabel = (value: TicketStatusFilter): string =>
  value === 'open' || value === 'inReview' ? statusGroupLabels[value] : statusMeta[value].label;
  
export const detailStatusMeta: Record<string, Meta> = {
  'ثبت شده': { label: 'ثبت شده', tone: 'neutral' },
  'در جریان': { label: 'در جریان', tone: 'warning' },
  'ثبت یادداشت توسط امور مشتریان': { label: 'ثبت یادداشت توسط امور مشتریان', tone: 'info' },
  'ثبت یادداشت توسط مالک پیگیری': { label: 'ثبت یادداشت توسط مالک پیگیری', tone: 'info' },
  'در حال اجرا': { label: 'در حال اجرا', tone: 'warning' },
  'رد شده - عدم آگاهی': { label: 'رد شده - عدم آگاهی', tone: 'neutral' },
  'رد شده - خارج از ضوابط': { label: 'رد شده - خارج از ضوابط', tone: 'error' },
  'وارده - رسیدگی شده': { label: 'وارده - رسیدگی شده', tone: 'success' },
  'وارده - خارج از اختیارات اجرایی': { label: 'وارده - خارج از اختیارات اجرایی', tone: 'warning' },
  'تبدیل به شکایت': { label: 'تبدیل به شکایت', tone: 'error' },
  'حل شده': { label: 'حل شده', tone: 'success' },
  'رد شده': { label: 'رد شده', tone: 'error' },
  'قابل قبول': { label: 'قابل قبول', tone: 'success' },
  'غیر قابل قبول': { label: 'غیر قابل قبول', tone: 'error' },
};

export const eventMeta: Record<TicketEventKind, Meta> = {
  created: { label: 'ایجاد', tone: 'info' },
  assigned: { label: 'تخصیص', tone: 'info' },
  referred: { label: 'ارجاع', tone: 'warning' },
  call: { label: 'تماس', tone: 'info' },
  statusChanged: { label: 'تغییر وضعیت', tone: 'neutral' },
  responded: { label: 'پاسخ', tone: 'success' },
  closed: { label: 'بسته شد', tone: 'neutral' },
};

export const noteErrorMessages: Record<NoteError, string> = {
  empty: 'متن یادداشت را وارد کنید.',
  tooLong: 'یادداشت بیش از حد طولانی است.',
};
