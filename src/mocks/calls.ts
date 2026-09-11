import type { Call, CallStatus } from '@/modules/calls';
import { autoLabelFor, buildTranscript, summaryFor } from './conversation';
import { mockCustomers, pickCustomer, type MockCustomer } from './customers';
import { createRandom } from './random';
import {
  agents,
  aiTags,
  busyHours,
  DAY,
  level1Weights,
  NOW,
  queues,
  scenarioNames,
  subjectTree,
} from './reference';
import { mockTickets } from './tickets';

/** Fake call-center (سیتاک) history. Delete once api.yml adapters exist. */

const random = createRandom(99);
const MINUTE = 60 * 1000;

const startOfToday = new Date(NOW);
startOfToday.setHours(0, 0, 0, 0);

/** A timestamp in the last `days` days, at a plausible office hour (fewer calls on Fridays). */
const callTime = (days: number) => {
  for (;;) {
    const day = new Date(startOfToday.getTime() - Math.floor(random.next() * days) * DAY);
    if (day.getDay() === 5 && random.next() < 0.75) continue;
    day.setHours(
      random.pick(busyHours),
      Math.floor(random.next() * 60),
      Math.floor(random.next() * 60),
    );
    if (day.getTime() < NOW - 20 * MINUTE) return day;
  }
};

const ticketsByCustomer = new Map<string, string[]>();
for (const ticket of mockTickets) {
  const ids = ticketsByCustomer.get(ticket.customer.nationalId) ?? [];
  ids.push(ticket.id);
  ticketsByCustomer.set(ticket.customer.nationalId, ids);
}

const makeCall = (index: number, startedAt: Date, status: CallStatus): Call => {
  const known = random.next() < 0.85;
  const customer: MockCustomer | undefined = known ? pickCustomer(random.next) : undefined;
  const talked = status === 'answered' || status === 'ongoing';
  const categorized = status === 'answered' && random.next() < 0.9;
  const level1 = random.pick(level1Weights);
  const level2 = random.pick(Object.keys(subjectTree[level1] ?? {}));
  const subject = {
    level1,
    level2,
    level3: random.pick(subjectTree[level1]?.[level2] ?? ['ندارد']),
  };
  const sentiment = random.pick(['positive', 'neutral', 'neutral', 'negative'] as const);
  const agentSentiment = random.pick([
    ...Array<'positive'>(11).fill('positive'),
    ...Array<'neutral'>(7).fill('neutral'),
    'negative',
    'negative',
  ] as const);
  // The AI mostly agrees with the agent; sometimes only on the main subject, rarely not at all.
  const detection = random.next();
  const aiLevel1 = detection < 0.9 ? level1 : random.pick(Object.keys(subjectTree));
  const aiLevel2 =
    detection < 0.78 ? level2 : random.pick(Object.keys(subjectTree[aiLevel1] ?? {}));
  const detectedSubject =
    detection < 0.78
      ? subject
      : {
          level1: aiLevel1,
          level2: aiLevel2,
          level3: random.pick(subjectTree[aiLevel1]?.[aiLevel2] ?? ['ندارد']),
        };
  const confidenceFloor = detection < 0.78 ? 0.8 : detection < 0.9 ? 0.6 : 0.45;
  const durationSec =
    status === 'answered'
      ? 45 + Math.floor(random.next() * 540)
      : status === 'ongoing'
        ? Math.floor((NOW - startedAt.getTime()) / 1000)
        : 0;
  const customerTickets = customer ? ticketsByCustomer.get(customer.nationalId) : undefined;

  return {
    id: `C-${String(880_000 + index)}`,
    direction: random.next() < 0.9 ? 'inbound' : 'outbound',
    status,
    startedAt,
    durationSec,
    waitSec:
      status === 'ringing' ? 0 : 5 + Math.floor(random.next() * (status === 'missed' ? 240 : 120)),
    caller: customer
      ? { mobile: customer.mobile, nationalId: customer.nationalId, fullName: customer.fullName }
      : { mobile: `09${random.digits(9)}` },
    queue: random.pick(queues),
    agent: talked ? random.pick(agents) : undefined,
    subject: categorized ? subject : undefined,
    ticketId:
      categorized && customerTickets && random.next() < 0.4
        ? random.pick(customerTickets)
        : undefined,
    resolvedOnFirstCall: status === 'answered' ? random.next() < 0.68 : undefined,
    voice: status === 'answered' ? { voiceId: `VC-${random.digits(6)}`, durationSec } : undefined,
    transcript: status === 'answered' ? buildTranscript(subject, sentiment, agentSentiment) : [],
    analysis:
      status === 'answered' && random.next() < 0.92
        ? {
            sentiment,
            agentSentiment,
            detectedSubject,
            detectionConfidence: Math.min(0.99, confidenceFloor + random.next() * 0.25),
            priority: sentiment === 'negative' ? 'high' : random.pick(['low', 'medium'] as const),
            autoLabel: autoLabelFor(subject),
            topic: level2,
            tags: [random.pick(aiTags), random.pick(aiTags)].filter(
              (t, i, all) => all.indexOf(t) === i,
            ),
            suggestedScenario: random.next() < 0.7 ? random.pick(scenarioNames) : undefined,
            summary: summaryFor(subject, sentiment),
          }
        : undefined,
  };
};

const history = Array.from({ length: 1400 }, (_, index) =>
  makeCall(index, callTime(60), random.next() < 0.84 ? 'answered' : 'missed'),
);

/** A few calls happening right now, so the «جاری» counters are never empty. */
const live = [
  makeCall(2000, new Date(NOW - 6 * MINUTE), 'ongoing'),
  makeCall(2001, new Date(NOW - 3 * MINUTE), 'ongoing'),
  makeCall(2002, new Date(NOW - 11 * MINUTE), 'ongoing'),
  makeCall(2003, new Date(NOW - 0.5 * MINUTE), 'ringing'),
];

export const mockCalls: Call[] = [...live, ...history].sort(
  (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
);

/** The customer record behind a caller, for aggregations that need a branch or policy line. */
export const customerOfCall = (call: Call) =>
  call.caller.nationalId
    ? mockCustomers.find((customer) => customer.nationalId === call.caller.nationalId)
    : undefined;
