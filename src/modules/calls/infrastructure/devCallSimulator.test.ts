import { mockCalls } from '@/mocks/calls';
import { MockAnalyticsRepository } from '@/modules/dashboard';
import type { Call, IncomingCall } from '../domain/call';
import { subscribeToCallFeed } from '../domain/callFeed';
import { MockCallRepository } from './MockCallRepository';
import { simulateIncomingCall, tickCallSimulator } from './devCallSimulator';
import { subscribeToFeed } from './incomingFeed';

const isLive = (call: Call) => call.status === 'ringing' || call.status === 'ongoing';
/** Ids the dataset shipped with, so «created by the simulator» is a set difference. */
const initialIds = new Set(mockCalls.map((call) => call.id));
const initialMaxId = Math.max(...[...initialIds].map((id) => Number(id.slice(2))));
const created = () => mockCalls.filter((call) => !initialIds.has(call.id));

describe('devCallSimulator', () => {
  it('adds a call to the data without ringing the popup', () => {
    const before = mockCalls.length;
    const notifications: number[] = [];
    const incoming: IncomingCall[] = [];
    const stopData = subscribeToCallFeed(() => notifications.push(mockCalls.length));
    const stopPopup = subscribeToFeed((call) => incoming.push(call));

    tickCallSimulator();
    stopData();
    stopPopup();

    expect(mockCalls.length).toBe(before + 1);
    expect(mockCalls[0]!.id).toMatch(/^C-\d+$/);
    expect(Number(mockCalls[0]!.id.slice(2))).toBe(initialMaxId + 1); // «C-882004», not «C-SIM-…»
    expect(mockCalls[0]!.direction).toBe('inbound');
    expect(notifications.length).toBeGreaterThan(0);
    expect(incoming).toEqual([]); // only the dev button may ring the popup
  });

  it('rings the popup only when the dev button creates a call', () => {
    const incoming: IncomingCall[] = [];
    const stop = subscribeToFeed((call) => incoming.push(call));

    const created = simulateIncomingCall();
    stop();

    expect(incoming.map((call) => call.callId)).toEqual([created.callId]);
    expect(created.callId).toMatch(/^C-\d+$/);
  });

  it('moves ringing calls on and keeps the live count capped', () => {
    const ringing = mockCalls.filter((call) => call.status === 'ringing');

    for (let i = 0; i < 40; i += 1) tickCallSimulator();

    expect(ringing.every((call) => call.status !== 'ringing')).toBe(true);
    expect(mockCalls.filter(isLive).length).toBeLessThanOrEqual(6);

    const answered = created().filter((call) => call.status === 'answered');
    expect(answered.length).toBeGreaterThan(0);
    expect(answered.every((call) => call.durationSec > 0 && call.agent !== undefined)).toBe(true);
  });

  it('moves the dashboard call figures on ticks, and they stay equal to the table', async () => {
    const analytics = new MockAnalyticsRepository();
    const calls = new MockCallRepository();
    const figures = (stats: Awaited<ReturnType<typeof analytics.getCallStats>>) =>
      [stats.ringing, stats.ongoing, stats.answered, stats.missed, stats.incoming] as const;
    const before = figures(await analytics.getCallStats({ filters: {} }));

    for (let i = 0; i < 10; i += 1) tickCallSimulator();

    const stats = await analytics.getCallStats({ filters: {} });
    const table = await calls.summarize({});
    expect(figures(stats)).not.toEqual(before);
    expect(stats.ringing + stats.ongoing).toBe(table.live);
    expect(stats.answered).toBe(table.answered);
    expect(stats.missed).toBe(table.missed);
    expect(stats.incoming).toBe(
      (
        await calls.list({
          page: 1,
          pageSize: 1,
          sort: { field: 'startedAt', direction: 'desc' },
          direction: 'inbound',
        })
      ).total,
    );
  });
});
