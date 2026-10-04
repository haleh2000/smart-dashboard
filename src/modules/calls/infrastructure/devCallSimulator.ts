import { mockCalls } from '@/mocks/calls';
import { mockCustomers } from '@/mocks/customers';
import { mockTickets } from '@/mocks/tickets';
import { agents, queues } from '@/mocks/reference';
import { createRandom } from '@/mocks/random';
import type { Call, IncomingCall } from '../domain/call';
import { publishCallUpdate } from '../domain/callFeed';
import { publishToFeed } from './incomingFeed';
import { addSimulatedCall } from './MockCallRepository';

const WEEK = 7 * 24 * 60 * 60 * 1000;
/** Ringing + ongoing calls on screen at once, so «در حال زنگ» stays a believable number. */
const MAX_LIVE_CALLS = 6;
const random = createRandom(4_217);
let lastCallId: number | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
/** How many ticks each ringing/ongoing call has been waiting to resolve. */
const ages = new Map<string, number>();

/**
 * New calls keep the backend's id format («C-880054»), continuing past the largest one the table
 * already holds — no «C-SIM-…» names leaking into the UI.
 */
const nextCallId = () => {
  lastCallId ??= mockCalls
    .map((call) => Number(call.id.slice(2)))
    .filter((id) => Number.isFinite(id))
    .reduce((max, id) => Math.max(max, id), 880_000);
  lastCallId += 1;
  return `C-${lastCallId}`;
};

/**
 * Builds one incoming call and appends it to the shared call array (the call feed is notified by
 * `addSimulatedCall`). The popup is a separate decision: only the dev button rings it.
 */
const createCall = () => {
  const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)]!;
  const now = new Date();
  const callerCalls = mockCalls.filter((call) => call.caller.nationalId === customer.nationalId);
  const lastSentiment = callerCalls.find((call) => call.analysis)?.analysis?.sentiment;
  const callId = nextCallId();
  const queue = queues[Math.floor(Math.random() * queues.length)]!;
  const caller = {
    mobile: customer.mobile,
    nationalId: customer.nationalId,
    fullName: customer.fullName,
  };

  const call: Call = {
    id: callId,
    direction: 'inbound',
    status: 'ringing',
    startedAt: now,
    durationSec: 0,
    waitSec: 0,
    caller,
    queue,
    transcript: [],
  };
  addSimulatedCall(call);

  return {
    callId,
    startedAt: now,
    queue,
    caller,
    customer: {
      nationalId: customer.nationalId,
      fullName: customer.fullName,
      isVip: customer.isVip,
      openTicketCount: mockTickets.filter(
        (ticket) =>
          ticket.customer.nationalId === customer.nationalId && ticket.status !== 'closed',
      ).length,
      lastSentiment,
      recentCallCount: callerCalls.filter((c) => now.getTime() - c.startedAt.getTime() < WEEK)
        .length,
    },
  } satisfies IncomingCall;
};

/**
 * Development-only: the dev button rings the incoming-call popup with a random known customer,
 * as the call center would. Remove together with MockCallRepository.
 */
export const simulateIncomingCall = () => {
  const incoming = createCall();
  publishToFeed(incoming);
  return incoming;
};

const liveCalls = () =>
  mockCalls.filter((call) => call.status !== 'answered' && call.status !== 'missed');

/** One call moves on: ringing → ongoing (or missed) → answered. */
const progress = (call: Call) => {
  const age = (ages.get(call.id) ?? 0) + 1;
  ages.set(call.id, age);
  if (call.status === 'ringing') {
    if (age < 2) return;
    if (random.next() < 0.3) {
      call.status = 'missed';
      call.waitSec = 15 + Math.floor(random.next() * 45);
      ages.delete(call.id);
      return;
    }
    call.status = 'ongoing';
    call.agent ??= random.pick(agents);
    call.waitSec = Math.max(call.waitSec, 5 + Math.floor(random.next() * 60));
    return;
  }
  if (age < 4) return;
  call.status = 'answered';
  call.durationSec = 30 + Math.floor(random.next() * 240);
  call.resolvedOnFirstCall = random.next() < 0.68;
  ages.delete(call.id);
};

/**
 * One simulation step: a call arrives in the data (silently — the popup only rings for the dev
 * button), a couple advance, then the call feed is notified.
 */
export const tickCallSimulator = () => {
  if (liveCalls().length < MAX_LIVE_CALLS) createCall();

  const live = liveCalls();
  for (let i = 0; i < 2 && live.length > 0; i += 1) {
    progress(live[Math.floor(random.next() * live.length)]!);
  }

  publishCallUpdate();
};

export const stopCallSimulator = () => {
  if (timer === undefined) return;
  clearInterval(timer);
  timer = undefined;
};

/**
 * Development-only: keeps the call cards in «تماس‌ها و ساعات پیک» moving without a page reload,
 * the same way startKpiSimulator keeps the ticket KPIs moving. Remove together with the mocks.
 * Returns a stop function; starting twice is a no-op.
 */
export const startCallSimulator = (intervalMs = 15_000) => {
  if (timer === undefined) timer = setInterval(tickCallSimulator, intervalMs);
  return stopCallSimulator;
};
