import type { Call, CallAnalysis, CallStatus } from '@/modules/calls';
import type { SubjectPath } from '@/shared/domain/insights';
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

const random = createRandom(99);
const MINUTE = 60 * 1000;

const TALK_PACE = [1.55, 0.65, 1.2, 0.8, 1.35, 0.95, 1.1, 0.75];
const talkPace = new Map(
  agents.map((agent, index) => [agent, TALK_PACE[index % TALK_PACE.length]!]),
);

const startOfToday = new Date(NOW);
startOfToday.setHours(0, 0, 0, 0);

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

export type MockRandom = ReturnType<typeof createRandom>;

/** A random 3-level subject, weighted like the real distribution. */
const pickSubject = (random: MockRandom) => {
  const level1 = random.pick(level1Weights);
  const level2 = random.pick(Object.keys(subjectTree[level1] ?? {}));
  return { level1, level2, level3: random.pick(subjectTree[level1]?.[level2] ?? ['ندارد']) };
};

const pickSentiment = (random: MockRandom) =>
  random.pick(['positive', 'neutral', 'neutral', 'negative'] as const);

const pickAgentSentiment = (random: MockRandom) =>
  random.pick([
    ...Array<'positive'>(11).fill('positive'),
    ...Array<'neutral'>(7).fill('neutral'),
    'negative',
    'negative',
  ] as const);

/** AI detection: usually it matches the agent's subject, sometimes it drifts to another branch. */
const detectSubject = (random: MockRandom, subject: SubjectPath) => {
  const detection = random.next();
  const aiLevel1 = detection < 0.9 ? subject.level1 : random.pick(Object.keys(subjectTree));
  const aiLevel2 =
    detection < 0.78
      ? subject.level2
      : random.pick(Object.keys(subjectTree[aiLevel1] ?? {}));
  return {
    confidenceFloor: detection < 0.78 ? 0.8 : detection < 0.9 ? 0.6 : 0.45,
    detectedSubject:
      detection < 0.78
        ? subject
        : {
            level1: aiLevel1,
            level2: aiLevel2,
            level3: random.pick(subjectTree[aiLevel1]?.[aiLevel2] ?? ['ندارد']),
          },
  };
};

/** The AI analysis an answered call comes back with: both sentiments, subject, tags, summary. */
const buildAnalysis = (random: MockRandom, subject: SubjectPath): CallAnalysis => {
  const sentiment = pickSentiment(random);
  const { confidenceFloor, detectedSubject } = detectSubject(random, subject);
  return {
    sentiment,
    agentSentiment: pickAgentSentiment(random),
    detectedSubject,
    detectionConfidence: Math.min(0.99, confidenceFloor + random.next() * 0.25),
    priority: sentiment === 'negative' ? 'high' : random.pick(['low', 'medium'] as const),
    autoLabel: autoLabelFor(subject),
    topic: subject.level2,
    tags: [random.pick(aiTags), random.pick(aiTags)].filter(
      (t, i, all) => all.indexOf(t) === i,
    ),
    suggestedScenario: random.next() < 0.7 ? random.pick(scenarioNames) : undefined,
    summary: summaryFor(subject, sentiment),
  };
};

/**
 * Fills in everything the backend sends once a live call is answered — operator subject, AI
 * analysis, recording and transcript — so a call never sits in the table answered but blank.
 * Existing values win, so an agent's categorization is never overwritten.
 */
export const analyzeAnsweredCall = <T extends Call>(call: T, random: MockRandom): T => {
  const subject = call.subject ?? pickSubject(random);
  call.subject = subject;
  call.analysis ??= buildAnalysis(random, subject);
  call.voice ??= { voiceId: `VC-${random.digits(6)}`, durationSec: call.durationSec };
  if (call.transcript.length === 0)
    call.transcript = buildTranscript(subject, call.analysis.sentiment, call.analysis.agentSentiment);
  const customerTickets = call.caller.nationalId
    ? ticketsByCustomer.get(call.caller.nationalId)
    : undefined;
  call.ticketId ??=
    customerTickets && random.next() < 0.4 ? random.pick(customerTickets) : undefined;
  return call;
};

const makeCall = (index: number, startedAt: Date, status: CallStatus): Call => {
  const known = random.next() < 0.85;
  const customer: MockCustomer | undefined = known ? pickCustomer(random.next) : undefined;
  const talked = status === 'answered' || status === 'ongoing';

  /** The AI always analyzes an answered call; the operator still leaves ~10% uncategorized. */
  const categorized = status === 'answered' && random.next() < 0.9;

  const subject = pickSubject(random);
  const agent = talked ? random.pick(agents) : undefined;
  const durationSec =
    status === 'answered'
      ? Math.round(
          (30 + Math.pow(random.next(), 2.2) * 720) * (agent ? (talkPace.get(agent) ?? 1) : 1),
        )
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
    agent,
    subject: categorized ? subject : undefined,
    ticketId:
      categorized && customerTickets && random.next() < 0.4
        ? random.pick(customerTickets)
        : undefined,
    resolvedOnFirstCall: status === 'answered' ? random.next() < 0.68 : undefined,
    voice: status === 'answered' ? { voiceId: `VC-${random.digits(6)}`, durationSec } : undefined,
    transcript:
      status === 'answered'
        ? buildTranscript(subject, pickSentiment(random), pickAgentSentiment(random))
        : [],
    analysis: status === 'answered' ? buildAnalysis(random, subject) : undefined,
  };
};

const history = Array.from({ length: 1400 }, (_, index) =>
  makeCall(index, callTime(60), random.next() < 0.84 ? 'answered' : 'missed'),
);

const live = [
  makeCall(2000, new Date(NOW - 6 * MINUTE), 'ongoing'),
  makeCall(2001, new Date(NOW - 3 * MINUTE), 'ongoing'),
  makeCall(2002, new Date(NOW - 11 * MINUTE), 'ongoing'),
  makeCall(2003, new Date(NOW - 0.5 * MINUTE), 'ringing'),
];

export const mockCalls: Call[] = [...live, ...history].sort(
  (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
);

export const customerOfCall = (call: Call) =>
  call.caller.nationalId
    ? mockCustomers.find((customer) => customer.nationalId === call.caller.nationalId)
    : undefined;
