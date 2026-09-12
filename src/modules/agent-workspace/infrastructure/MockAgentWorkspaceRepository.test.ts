import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockAgentWorkspaceRepository } from './MockAgentWorkspaceRepository';

describe('MockAgentWorkspaceRepository', () => {
  let repo: MockAgentWorkspaceRepository;

  beforeEach(() => {
    repo = new MockAgentWorkspaceRepository();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns workspace data with shift state', async () => {
    const data = await repo.getWorkspaceData('u-1');
    expect(data).toBeDefined();
    expect(data.shiftState).toBeDefined();
    expect(data.shiftState.status).toBe('ready');
    expect(data.shiftState.statusLabel).toBe('آماده');
  });

  it('returns work queue with assigned open tickets', async () => {
    const data = await repo.getWorkspaceData('u-1');
    expect(Array.isArray(data.workQueue)).toBe(true);
    data.workQueue.forEach((item) => {
      expect(item.ticket.status).not.toBe('closed');
      expect(typeof item.isOverdue).toBe('boolean');
      expect(typeof item.isHighPriority).toBe('boolean');
      expect(typeof item.isNegativeSentiment).toBe('boolean');
    });
  });

  it('returns shift summary with stats', async () => {
    const data = await repo.getWorkspaceData('u-1');
    expect(data.shiftSummary).toBeDefined();
    expect(typeof data.shiftSummary.callsHandledToday).toBe('number');
    expect(typeof data.shiftSummary.ticketsResolvedToday).toBe('number');
    expect(typeof data.shiftSummary.avgHandleTimeSec).toBe('number');
  });

  it('computes next action based on work queue', async () => {
    const data = await repo.getWorkspaceData('u-1');
    if (data.nextAction) {
      expect(['slaWarning', 'negativeSentiment', 'highPriority', 'followUp']).toContain(
        data.nextAction.type
      );
      expect(['high', 'medium', 'low']).toContain(data.nextAction.severity);
    }
  });

  it('updates agent status and returns new state', async () => {
    const newState = await repo.updateAgentStatus('u-1', 'inCall');
    expect(newState.status).toBe('inCall');
    expect(newState.statusLabel).toBe('در تماس');

    const data = await repo.getWorkspaceData('u-1');
    expect(data.shiftState.status).toBe('inCall');
  });

  it('persists status across calls', async () => {
    await repo.updateAgentStatus('u-1', 'break');
    const data = await repo.getWorkspaceData('u-1');
    expect(data.shiftState.status).toBe('break');
    expect(data.shiftState.statusLabel).toBe('استراحت');
  });
});