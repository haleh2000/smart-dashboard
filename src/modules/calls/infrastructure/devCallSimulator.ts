import { mockCalls } from '@/mocks/calls';
import { mockCustomers } from '@/mocks/customers';
import { mockTickets } from '@/mocks/tickets';
import { queues } from '@/mocks/reference';
import type { Call, IncomingCall } from '../domain/call';
import { publishToFeed } from './incomingFeed';
import { addSimulatedCall } from './MockCallRepository';

const WEEK = 7 * 24 * 60 * 60 * 1000;
let sequence = 0;

/**
 * Development-only: rings the incoming-call popup with a random known customer, as the call
 * center would. Remove together with MockCallRepository.
 */
export const simulateIncomingCall = () => {
  const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)]!;
  const now = new Date();
  const callerCalls = mockCalls.filter((call) => call.caller.nationalId === customer.nationalId);
  const lastSentiment = callerCalls.find((call) => call.analysis)?.analysis?.sentiment;
  sequence += 1;
  const callId = `C-SIM-${now.getTime().toString(36)}-${sequence}`;
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

  const incoming: IncomingCall = {
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
  };
  publishToFeed(incoming);
  return incoming;
};
