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

/** Clean SMART labels for CRM statuses, colored as in README → «نمایش وضعیت به‌صورت Badge رنگی». */
export const statusMeta: Record<TicketStatus, Meta & { live: boolean }> = {
  pending: { label: 'در انتظار', tone: 'error', live: true },
  inProgress: { label: 'در جریان', tone: 'warning', live: true },
  registered: { label: 'ثبت‌شده', tone: 'neutral', live: false },
  underReview: { label: 'در رسیدگی', tone: 'success', live: true },
  referred: { label: 'ارجاع‌شده', tone: 'success', live: false },
  closed: { label: 'بسته‌شده', tone: 'neutral', live: false },
};

/** The two list-filter groups, named after the KPI cards whose figures they reproduce. */
export const statusGroupLabels: Record<'open' | 'inReview', string> = {
  open: 'باز (غیر بسته‌شده)',
  inReview: 'در حال بررسی',
};

/** Label of any status-filter option: a CRM status or one of the KPI groups. */
export const statusFilterLabel = (value: TicketStatusFilter): string =>
  value === 'open' || value === 'inReview' ? statusGroupLabels[value] : statusMeta[value].label;

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
