import { SENTIMENTS, type Sentiment } from '@/shared/domain/insights';
import { formatPersianNumber } from '@/shared/lib/format';
import { sentimentMeta } from '@/shared/ui';
import type { SentimentLevel } from '../domain/sentimentLevels';
import type { Dimension } from '../domain/filters';

const SENTIMENT_LEVEL_LABELS: Record<SentimentLevel, string> = {
  angry: 'عصبانی',
  dissatisfied: 'ناراضی',
  neutral: 'خنثی',
  satisfied: 'راضی',
  verySatisfied: 'کاملا راضی',
};

export const dimensionLabels: Record<Dimension, string> = {
  subject1: 'موضوع اصلی',
  subject2: 'موضوع فرعی',
  subject3: 'علت',
  type: 'نوع کانال',
  channel: 'کانال',
  insuranceLine: 'رشته بیمه',
  branch: 'شعبه',
  sentiment: 'احساس',
  sentimentLevel: 'سطح احساس',
  operator: 'اپراتور',
  weekday: 'روز هفته',
  hour: 'ساعت',
};

/** Persian week, Saturday first (matches `persianWeekday`). */
export const weekdayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

export const hourLabel = (hour: number | string) =>
  formatPersianNumber(`${String(hour).padStart(2, '0')}:00`);

const isSentiment = (value: string): value is Sentiment =>
  (SENTIMENTS as readonly string[]).includes(value);

const SENTIMENT_LEVELS: readonly SentimentLevel[] = [
  'angry',
  'dissatisfied',
  'neutral',
  'satisfied',
  'verySatisfied',
];

const isSentimentLevel = (value: string): value is SentimentLevel =>
  (SENTIMENT_LEVELS as readonly string[]).includes(value);

/** Display order for channels (top to bottom in heatmap). */
export const channelOrder: readonly string[] = [
  'تلفن',
  'وب',
  'پیامک',
  'هپی‌کال',
  'دی آسا',
  'مشاوره آنلاین',
  'چت بات',
  'دیدار',
  'ثبت آنلاین',
  'چت آنلاین',
  'نرم افزار درمان',
  'پزشکان',
  'مرکز ملی ایثار',
  'وبسایت بیمه مرکز',
  'نظرسنجی',
  'صحت سنجی بیمه مرکزی',
  'نظرسنجی از بیمه گذاران سازمانی',
  'صندوق انتقادات و پیشنهادات',
  'مشتریان دی',
  'ریاست جمهوری',
  'چهارشنبه های پاسخگویی',
  'دستگاه نظرسنجی',
  'باشگاه مشتریان',
  'رضایت سنجی پس از شکایت',
  'پشتیبانی هوشمند',
  'ندارد',
];

/** Display text for a filter value (chips, tooltips); most dimensions hold display text already. */
export const dimensionValueLabel = (dimension: Dimension, value: string) => {
  if (dimension === 'sentiment' && isSentiment(value)) return sentimentMeta[value].label;
  if (dimension === 'sentimentLevel' && isSentimentLevel(value))
    return SENTIMENT_LEVEL_LABELS[value];
  if (dimension === 'weekday') return weekdayLabels[Number(value)] ?? value;
  if (dimension === 'hour') return hourLabel(value);
  return value;
};
