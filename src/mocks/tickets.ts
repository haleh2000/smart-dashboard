import type { Ticket, TicketStatus } from '@/modules/tickets';
import { autoLabelFor, buildTranscript } from './conversation';
import { pickCustomer } from './customers';
import { createRandom } from './random';
import {
  agents,
  aiTags,
  branches,
  channels,
  complaintSubjectTree,
  DAY,
  HOUR,
  insuranceLines,
  level1Weights,
  NOW,
  scenarioNames,
  subjectTree,
  ticketTypes,
} from './reference';


const statuses: TicketStatus[] = [
  'pending',
  'inProgress',
  'registered',
  'underReview',
  'referred',
  'closed',
  'closed',
  'closed',
  'closed',
];

const random = createRandom(42);

const isTreatmentLine = (line: string) => line.includes('درمان');
const NO_CORPORATE = 'بدون مقدار';

const COMPLAINT_OPEN_STATUSES = ['در جریان', 'ثبت یادداشت توسط امور مشتریان', 'ثبت شده'] as const;
const COMPLAINT_CLOSED_STATUSES = [
  'رد شده - عدم آگاهی',
  'رد شده - خارج از ضوابط',
  'وارده - رسیدگی شده',
  'وارده - خارج از اختیارات اجرایی',
] as const;
const FOLLOWUP_OPEN_STATUSES = [...COMPLAINT_OPEN_STATUSES] as const;
const FOLLOWUP_CLOSED_STATUSES = [...COMPLAINT_CLOSED_STATUSES, 'تبدیل به شکایت'] as const;
const REQUEST_OPEN_STATUSES = [
  'ثبت شده',
  'در جریان',
  'ثبت یادداشت توسط مالک پیگیری',
  'ثبت یادداشت توسط امور مشتریان',
] as const;
const REQUEST_CLOSED_STATUSES = ['حل شده', 'رد شده'] as const;
const SUGGESTION_OPEN_STATUSES = ['ثبت شده', 'در حال اجرا'] as const;
const SUGGESTION_CLOSED_STATUSES = ['قابل قبول', 'غیر قابل قبول'] as const;

function detailStatusFor(type: string): { detail: string; status: TicketStatus } {
  const pick = <T>(open: readonly T[], closed: readonly T[]): T =>
    random.next() < 0.45 ? random.pick([...open]) : random.pick([...closed]);
  if (type === 'شکایت') {
    const detail = String(pick(COMPLAINT_OPEN_STATUSES, COMPLAINT_CLOSED_STATUSES));
    const closed = (COMPLAINT_CLOSED_STATUSES as readonly string[]).includes(detail);
    return { detail, status: closed ? 'closed' : random.pick(['pending', 'inProgress', 'underReview', 'referred'] as TicketStatus[]) };
  }
  if (type === 'پیگیری') {
    const detail = String(pick(FOLLOWUP_OPEN_STATUSES, FOLLOWUP_CLOSED_STATUSES));
    const closed = (FOLLOWUP_CLOSED_STATUSES as readonly string[]).includes(detail);
    return { detail, status: closed ? 'closed' : random.pick(['pending', 'inProgress', 'underReview', 'referred'] as TicketStatus[]) };
  }
  if (type === 'درخواست') {
    const detail = String(pick(REQUEST_OPEN_STATUSES, REQUEST_CLOSED_STATUSES));
    const closed = (REQUEST_CLOSED_STATUSES as readonly string[]).includes(detail);
    return { detail, status: closed ? 'closed' : random.pick(['registered', 'inProgress', 'referred'] as TicketStatus[]) };
  }
  if (type === 'پیشنهاد') {
    const detail = String(pick(SUGGESTION_OPEN_STATUSES, SUGGESTION_CLOSED_STATUSES));
    const closed = (SUGGESTION_CLOSED_STATUSES as readonly string[]).includes(detail);
    return { detail, status: closed ? 'closed' : random.pick(['registered', 'inProgress'] as TicketStatus[]) };
  }
  return { detail: '', status: random.pick(statuses) };
}

export { NO_CORPORATE };

const typeSequence = (() => {
  const shuffle = createRandom(1_337);

  const units = ticketTypes.length;
  const share = new Map<string, number>();
  for (const type of ticketTypes) share.set(type, (share.get(type) ?? 0) + 1);
  const names = [...share.keys()];
  const sequence: string[] = [];
  let assigned = 0;
  names.forEach((type, index) => {
    const exact = (480 * share.get(type)!) / units;
    const quota = index === names.length - 1 ? 480 - assigned : Math.round(exact);
    assigned += quota;
    for (let i = 0; i < quota; i += 1) sequence.push(type);
  });
  for (let i = sequence.length - 1; i > 0; i -= 1) {
    const j = Math.floor(shuffle.next() * (i + 1));
    const held = sequence[i]!;
    sequence[i] = sequence[j]!;
    sequence[j] = held;
  }
  return sequence;
})();


const WEEKS = 13;
const floored = new Map<string, number>();
const createdAtFor = (type: string) => {
  const week = floored.get(type) ?? 0;
  if (week < WEEKS) {
    floored.set(type, week + 1);
    const weekStart = NOW - (week + 1) * 7 * DAY;
    return weekStart + Math.floor(random.next() * 7 * DAY);
  }
  return NOW - Math.floor(random.next() * 90 * DAY);
};

export const mockTickets: Ticket[] = Array.from({ length: 480 }, (_, index) => {
  const type = typeSequence[index]!;
  // شکایت موضوع تماس ندارد؛ موضوع شکایت ۳ لایه فقط برای پیگیری/درخواست/پیشنهاد،
  // موضوع تماس ۳ لایه فقط برای گفت‌وگو/ارتباط‌دهی.
  const useComplaintSubject = ['پیگیری', 'درخواست', 'پیشنهاد'].includes(type);
  const hasSubject = type !== 'شکایت';
  const tree = useComplaintSubject ? complaintSubjectTree : subjectTree;
  const roots = Object.keys(tree);
  const level1 = useComplaintSubject ? random.pick(roots) : random.pick(level1Weights);
  const safeLevel1 = tree[level1] ? level1 : random.pick(roots);
  const level2 = random.pick(Object.keys(tree[safeLevel1] ?? {}));
  const level3 = random.pick(tree[safeLevel1]?.[level2] ?? ['ندارد']);
  const subject = hasSubject ? { level1: safeLevel1, level2, level3 } : undefined;
  // فقط برای ساخت متن نمایشی enrichment (transcript)؛ به‌عنوان subject تیکت ذخیره نمی‌شود.
  const displaySubject = subject ?? { level1: 'پشتیبانی', level2: 'شکایت', level3: 'رسیدگی به شکایت' };
  const customer = pickCustomer(random.next);
  const createdAt = createdAtFor(type);
  const { detail, status } = detailStatusFor(type);
  const hasEnrichment = random.next() > 0.15;
  const sentiment = random.pick([
    'positive',
    'neutral',
    'neutral',
    'negative',
    'negative',
  ] as const);
  const agentSentiment = random.pick([
    ...Array<'positive'>(11).fill('positive'),
    ...Array<'neutral'>(7).fill('neutral'),
    'negative',
    'negative',
  ] as const);
  const firstResponseAt = createdAt + Math.floor((0.2 + random.next() * 30) * HOUR);
  const closedAt =
    status === 'closed'
      ? firstResponseAt + Math.floor((1 + random.next() * 9 * 24) * HOUR)
      : undefined;
  const line = customer.policies[0]?.line ?? random.pick(insuranceLines);
  const corporateName = isTreatmentLine(line) ? (customer.corporateName ?? (random.next() < 0.35 ? random.pick(['صندوق بازنشستگی کشوری', 'شرکت ملی نفت', 'بانک ملت', 'شهرداری تهران', 'سازمان آب و برق خوزستان ']) : undefined)) : undefined;

  let convertedFrom: string | undefined;
  let convertedTo: string | undefined;
  if ((type === 'شکایت' || type === 'درخواست' || type === 'پیشنهاد') && random.next() < 0.3) {
    convertedFrom = random.next() < 0.6 ? 'گفت‌وگو' : 'پیگیری';
  }
  if (type === 'پیگیری' && detail === 'تبدیل به شکایت') {
    convertedTo = 'شکایت'; 
  } else if (type === 'پیگیری' && random.next() < 0.08) {
    convertedTo = 'شکایت';
  }

  return {
    id: String(140_000 + index),
    createdAt: new Date(createdAt),
    type,
    status,
    detailStatus: detail || undefined,
    convertedFrom,
    convertedTo,
    channel: random.pick(channels),
    customer: {
      nationalId: customer.nationalId,
      mobile: customer.mobile,
      fullName: customer.fullName,
      gender: customer.gender,
      corporateName,
    },
    subject,
    insuranceLine: line,
    branch: random.next() < 0.6 ? customer.branch : random.pick(branches),
    complaintOwner: `کارشناس مرکز ارتباط ${random.pick(agents)}`,
    followUpOwner: random.pick(agents),
    complaintText: subject
      ? `مشتری درباره «${subject.level3}» پیگیری دارد و درخواست رسیدگی دارد.`
      : 'مشتری درخواست رسیدگی به شکایت دارد.',
    finalResponse:
      status === 'closed' ? 'موضوع بررسی و نتیجه از طریق پیامک به مشتری اعلام شد.' : undefined,
    fileNumber: subject && safeLevel1 === 'پس از صدور' ? `F-${random.digits(8)}` : undefined,
    description: random.next() < 0.4 ? 'مشتری درخواست تماس در ساعات اداری دارد.' : undefined,
    rootCause:
      status === 'closed' && random.next() < 0.6 ? 'تاخیر در ارسال مدارک از سوی شعبه' : undefined,
    followUpRequest: random.next() < 0.25 ? 'بررسی مجدد مدارک ارسالی' : undefined,
    slaOpinion: random.next() < 0.2 ? 'رسیدگی خارج از SLA به دلیل نقص مدارک' : undefined,
    slaRemainingDays: status === 'closed' ? 0 : Math.floor(random.next() * 12) - 3,
    referralCount: Math.floor(random.next() * 4),
    firstResponseAt: firstResponseAt < NOW ? new Date(firstResponseAt) : undefined,
    closedAt: closedAt && closedAt < NOW ? new Date(closedAt) : undefined,
    starred: index % 17 === 0,
    enrichment: hasEnrichment
      ? {
          sentiment,
          priority:
            sentiment === 'negative'
              ? random.pick(['medium', 'high', 'high'] as const)
              : random.pick(['low', 'medium'] as const),
          aiTags: [random.pick(aiTags), random.pick(aiTags)].filter(
            (tag, i, all) => all.indexOf(tag) === i,
          ),
          autoLabel: autoLabelFor(displaySubject),
          topic: subject?.level2 ?? 'شکایت',
          suggestedScenario: random.next() < 0.7 ? random.pick(scenarioNames) : undefined,
          voice:
            random.next() < 0.8
              ? {
                  voiceId: `VC-${random.digits(6)}`,
                  durationSec: 60 + Math.floor(random.next() * 400),
                }
              : undefined,
          transcript: buildTranscript(displaySubject, sentiment, agentSentiment),
        }
      : null,
  };
});
