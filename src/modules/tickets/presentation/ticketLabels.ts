import type { BadgeTone } from '@/shared/ui';
import type { Priority, Sentiment, TicketStatus } from '../domain/ticket';

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

export const sentimentMeta: Record<Sentiment, Meta> = {
  positive: { label: 'مثبت', tone: 'success' },
  neutral: { label: 'خنثی', tone: 'neutral' },
  negative: { label: 'منفی', tone: 'error' },
};

export const priorityMeta: Record<Priority, Meta> = {
  low: { label: 'کم', tone: 'neutral' },
  medium: { label: 'متوسط', tone: 'warning' },
  high: { label: 'زیاد', tone: 'error' },
};
