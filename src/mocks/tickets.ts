import type { Ticket, TicketStatus } from '@/modules/tickets';
import { createRandom } from './random';

/** Fake CRM dataset shared by all mock repositories (tickets + analytics). Delete once api.yml adapters exist. */

const subjectTree: Record<string, Record<string, string[]>> = {
  'پس از صدور': {
    خسارت: ['ثبت پرونده خسارت', 'پیگیری پرداخت خسارت', 'اعتراض به مبلغ'],
    الحاقیه: ['تغییر پلاک', 'تغییر مالکیت'],
  },
  'ارتباط با مشتری': {
    پیگیری: ['وضعیت تیکت', 'تماس مجدد'],
    اطلاعات: ['آدرس شعب', 'ساعات کاری'],
  },
  اطلاع‌رسانی: { تمدید: ['یادآوری تمدید', 'شرایط تمدید'] },
  صدور: { خرید: ['استعلام قیمت', 'صدور آنلاین'] },
  سایر: { متفرقه: ['ندارد'] },
};
// Weighted so the donut roughly matches the Power BI reference (پس از صدور ≈ 54%).
const level1Weights = [
  'پس از صدور',
  'پس از صدور',
  'پس از صدور',
  'پس از صدور',
  'پس از صدور',
  'ارتباط با مشتری',
  'ارتباط با مشتری',
  'اطلاع‌رسانی',
  'صدور',
  'سایر',
];

const types = ['گفت‌وگو', 'شکایت', 'درخواست', 'پیشنهاد', 'ارتباط‌دهی'];
const channels = ['تلفن', 'وب', 'پنل', 'هپی‌کال', 'ثبت آنلاین'];
const insuranceLines = [
  'ثالث خودرو',
  'بدنه خودرو',
  'درمان تکمیلی سازمانی',
  'درمان انفرادی',
  'آتش‌سوزی',
];
const branches = ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج', 'اهواز', 'قم'];
const statuses: TicketStatus[] = [
  'pending',
  'inProgress',
  'registered',
  'underReview',
  'referred',
  'closed',
  'closed',
  'closed',
];
const operators = ['سارا احمدی', 'مهدی کریمی', 'نرگس موسوی', 'حمید نوری'];
const firstNames = ['محمد', 'زهرا', 'رضا', 'فاطمه', 'امیر', 'مریم', 'حسین', 'نازنین'];
const lastNames = ['محمدی', 'حسینی', 'رضایی', 'کاظمی', 'جعفری', 'صادقی'];
const tags = ['خسارت', 'تاخیر', 'پرداخت', 'تمدید', 'VIP', 'تکرار تماس'];

const random = createRandom(42);
const now = new Date('2026-09-01T12:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

export const mockTickets: Ticket[] = Array.from({ length: 480 }, (_, index) => {
  const level1 = random.pick(level1Weights);
  const level2 = random.pick(Object.keys(subjectTree[level1] ?? {}));
  const level3 = random.pick(subjectTree[level1]?.[level2] ?? ['ندارد']);
  const hasEnrichment = random.next() > 0.15;

  return {
    id: String(140_000 + index),
    createdAt: new Date(now - Math.floor(random.next() * 90 * DAY)),
    type: random.pick(types),
    status: random.pick(statuses),
    channel: random.pick(channels),
    customer: {
      nationalId: random.digits(10),
      mobile: `09${random.digits(9)}`,
      fullName: `${random.pick(firstNames)} ${random.pick(lastNames)}`,
    },
    subject: { level1, level2, level3 },
    insuranceLine: random.pick(insuranceLines),
    branch: random.pick(branches),
    complaintOwner: random.pick(operators),
    followUpOwner: random.pick(operators),
    complaintText: `مشتری درباره «${level3}» پیگیری دارد.`,
    enrichment: hasEnrichment
      ? {
          sentiment: random.pick(['positive', 'neutral', 'negative'] as const),
          priority: random.pick(['low', 'medium', 'high'] as const),
          aiTags: [random.pick(tags), random.pick(tags)].filter(
            (tag, i, all) => all.indexOf(tag) === i,
          ),
          voiceId: `VC-${random.digits(6)}`,
          transcript:
            'اپراتور: سلام، بیمه دی، بفرمایید.\nمشتری: سلام، درباره پرونده‌ام تماس گرفتم…',
        }
      : null,
  };
});
