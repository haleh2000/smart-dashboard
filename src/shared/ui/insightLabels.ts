import type { Priority, Sentiment, Speaker } from '@/shared/domain/insights';
import type { Period } from '@/shared/domain/period';
import type { BadgeTone } from './StatusBadge';

interface Meta {
  label: string;
  tone: BadgeTone;
}

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

export const speakerLabels: Record<Speaker, string> = {
  agent: 'اپراتور',
  customer: 'مشتری',
};

export const periodLabels: Record<Period, string> = {
  today: 'امروز',
  '7d': '۷ روز اخیر',
  '30d': '۳۰ روز اخیر',
  '90d': '۹۰ روز اخیر',
  all: 'همه زمان‌ها',
};
