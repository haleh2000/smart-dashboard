import { mockCalls } from '@/mocks/calls';
import type { IncomingCall } from '../domain/call';
import { simulateIncomingCall } from './devCallSimulator';
import { MockCallRepository } from './MockCallRepository';

const baseQuery = {
  page: 1,
  pageSize: 10,
  sort: { field: 'startedAt', direction: 'desc' },
} as const;

describe('MockCallRepository', () => {
  it('pages and sorts newest first', async () => {
    const repository = new MockCallRepository();
    const page = await repository.list(baseQuery);

    expect(page.items).toHaveLength(10);
    expect(page.total).toBeGreaterThanOrEqual(mockCalls.length);
    expect(page.items[0]!.startedAt.getTime()).toBeGreaterThanOrEqual(
      page.items[1]!.startedAt.getTime(),
    );
  });

  it('filters by status and uncategorized calls', async () => {
    const repository = new MockCallRepository();
    const missed = await repository.list({ ...baseQuery, status: 'missed' });
    const uncategorized = await repository.list({ ...baseQuery, uncategorizedOnly: true });

    expect(missed.items.every((call) => call.status === 'missed')).toBe(true);
    expect(uncategorized.items.every((c) => c.status === 'answered' && !c.subject)).toBe(true);
  });

  it('saves the 3-level categorization', async () => {
    const repository = new MockCallRepository();
    const [target] = (await repository.list({ ...baseQuery, uncategorizedOnly: true })).items;
    const subject = { level1: 'صدور', level2: 'خرید', level3: 'استعلام قیمت' };

    await repository.categorize(target!.id, subject);

    expect((await repository.getById(target!.id))?.subject).toEqual(subject);
  });

  it('pushes simulated incoming calls to subscribers and lists them as ringing', async () => {
    const repository = new MockCallRepository();
    const received: IncomingCall[] = [];
    const unsubscribe = repository.subscribeIncoming((call) => received.push(call));

    const incoming = simulateIncomingCall();
    unsubscribe();
    simulateIncomingCall();

    expect(received).toEqual([incoming]);
    expect((await repository.getById(incoming.callId))?.status).toBe('ringing');
  });

  it('exposes the subject tree for the picker', async () => {
    const tree = await new MockCallRepository().getSubjectTree();

    expect(tree.length).toBeGreaterThan(0);
    expect(tree[0]!.children[0]!.children.length).toBeGreaterThan(0);
  });
});
