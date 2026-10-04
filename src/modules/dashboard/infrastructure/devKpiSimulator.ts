import { pickCustomer } from '@/mocks/customers';
import { createRandom } from '@/mocks/random';
import {
  agents,
  channels,
  insuranceLines,
  level1Weights,
  subjectTree,
  ticketTypes,
} from '@/mocks/reference';
import { mockTickets } from '@/mocks/tickets';
import type { Ticket, TicketStatus } from '@/modules/tickets';
import { publishTicketUpdate } from '@/modules/tickets';

const random = createRandom(7_331);
const MAX_LIVE_TICKETS = 120;
const OPENING_STATUSES: TicketStatus[] = [
  'registered',
  'pending',
  'inProgress',
  'underReview',
  'referred',
];
const REVIEWING_STATUSES: TicketStatus[] = ['inProgress', 'underReview'];

let sequence = 0;
let timer: ReturnType<typeof setInterval> | undefined;
/** Tickets this simulator appended to `mockTickets`, oldest first. */
const live: Ticket[] = [];

const createTicket = (now: Date): Ticket => {
  const level1 = random.pick(level1Weights);
  const level2 = random.pick(Object.keys(subjectTree[level1] ?? {}));
  const level3 = random.pick(subjectTree[level1]?.[level2] ?? ['ندارد']);
  const customer = pickCustomer(random.next);
  sequence += 1;
  return {
    id: String(900_000 + sequence),
    createdAt: now,
    type: random.pick(ticketTypes),
    status: random.pick(OPENING_STATUSES),
    channel: random.pick(channels),
    customer: {
      nationalId: customer.nationalId,
      mobile: customer.mobile,
      fullName: customer.fullName,
      gender: customer.gender,
      corporateName: customer.corporateName,
    },
    subject: { level1, level2, level3 },
    insuranceLine: customer.policies[0]?.line ?? random.pick(insuranceLines),
    branch: customer.branch,
    complaintOwner: `کارشناس مرکز ارتباط ${random.pick(agents)}`,
    followUpOwner: random.pick(agents),
    complaintText: `مشتری درباره «${level3}» پیگیری دارد و درخواست رسیدگی دارد.`,
    slaRemainingDays: Math.floor(random.next() * 12) - 3,
    referralCount: Math.floor(random.next() * 4),
    starred: false,
    enrichment: null,
  };
};

/** Moves one live ticket forward: opened → under review → closed. */
const progress = (ticket: Ticket, now: Date) => {
  const reviewing = REVIEWING_STATUSES.includes(ticket.status);
  if (reviewing && random.next() < 0.4) {
    ticket.status = 'closed';
    ticket.closedAt = now;
    ticket.firstResponseAt ??= new Date(
      now.getTime() - Math.floor((0.1 + random.next() * 3) * 60 * 60 * 1000),
    );
    ticket.finalResponse = 'موضوع بررسی و نتیجه از طریق پیامک به مشتری اعلام شد.';
    ticket.slaRemainingDays = 0;
    return;
  }
  if (!reviewing) ticket.status = random.pick(REVIEWING_STATUSES);
};

/** One simulation step: new tickets arrive, a few advance, then KPI listeners are notified. */
export const tickKpiSimulator = () => {
  const now = new Date();
  const arriving = 1 + Math.floor(random.next() * 2);
  for (let i = 0; i < arriving; i += 1) {
    const ticket = createTicket(now);
    live.push(ticket);
    mockTickets.push(ticket);
  }

  const open = live.filter((ticket) => ticket.status !== 'closed');
  for (let i = 0; i < 2 && open.length > 0; i += 1) {
    progress(open[Math.floor(random.next() * open.length)]!, now);
  }

  while (live.length > MAX_LIVE_TICKETS) {
    const oldest = live.shift()!;
    const index = mockTickets.indexOf(oldest);
    if (index >= 0) mockTickets.splice(index, 1);
  }

  publishTicketUpdate();
};

export const stopKpiSimulator = () => {
  if (timer === undefined) return;
  clearInterval(timer);
  timer = undefined;
};

/**
 * Development-only: keeps the dashboard KPIs moving so «نسبت به ساعت قبل» is live without a
 * page reload. Remove together with MockAnalyticsRepository once the real feed exists.
 * Returns a stop function; starting twice is a no-op.
 */
export const startKpiSimulator = (intervalMs = 8_000) => {
  if (timer === undefined) timer = setInterval(tickKpiSimulator, intervalMs);
  return stopKpiSimulator;
};
