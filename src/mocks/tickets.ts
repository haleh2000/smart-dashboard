import type { Ticket, TicketStatus } from '@/modules/tickets';
import { autoLabelFor, buildTranscript } from './conversation';
import { pickCustomer } from './customers';
import { createRandom } from './random';
import {
  agents,
  aiTags,
  branches,
  channels,
  DAY,
  HOUR,
  insuranceLines,
  level1Weights,
  NOW,
  scenarioNames,
  subjectTree,
  ticketTypes,
} from './reference';

/** Fake CRM tickets shared by all mock repositories. Delete once api.yml adapters exist. */

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

export const mockTickets: Ticket[] = Array.from({ length: 480 }, (_, index) => {
  const level1 = random.pick(level1Weights);
  const level2 = random.pick(Object.keys(subjectTree[level1] ?? {}));
  const level3 = random.pick(subjectTree[level1]?.[level2] ?? ['ندارد']);
  const subject = { level1, level2, level3 };
  const customer = pickCustomer(random.next);
  const createdAt = NOW - Math.floor(random.next() * 90 * DAY);
  const status = random.pick(statuses);
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

  return {
    id: String(140_000 + index),
    createdAt: new Date(createdAt),
    type: random.pick(ticketTypes),
    status,
    channel: random.pick(channels),
    customer: {
      nationalId: customer.nationalId,
      mobile: customer.mobile,
      fullName: customer.fullName,
      gender: customer.gender,
      corporateName: customer.corporateName,
    },
    subject,
    insuranceLine: line,
    branch: random.next() < 0.6 ? customer.branch : random.pick(branches),
    complaintOwner: `کارشناس مرکز ارتباط ${random.pick(agents)}`,
    followUpOwner: random.pick(agents),
    complaintText: `مشتری درباره «${level3}» پیگیری دارد و درخواست رسیدگی دارد.`,
    finalResponse:
      status === 'closed' ? 'موضوع بررسی و نتیجه از طریق پیامک به مشتری اعلام شد.' : undefined,
    fileNumber: level1 === 'پس از صدور' ? `F-${random.digits(8)}` : undefined,
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
          autoLabel: autoLabelFor(subject),
          topic: level2,
          suggestedScenario: random.next() < 0.7 ? random.pick(scenarioNames) : undefined,
          voice:
            random.next() < 0.8
              ? {
                  voiceId: `VC-${random.digits(6)}`,
                  durationSec: 60 + Math.floor(random.next() * 400),
                }
              : undefined,
          transcript: buildTranscript(subject, sentiment, agentSentiment),
        }
      : null,
  };
});
