import { mockTickets } from '@/mocks/tickets';
import { mockUsers } from '@/mocks/users';
import type { AgentWorkspaceRepository, AgentWorkspaceData, AgentShiftState, AgentStatus } from '../domain';
import { computeNextAction } from '../domain/agentWorkspace';

const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  ready: 'آماده',
  inCall: 'در تماس',
  wrapUp: 'اتمام تماس',
  break: 'استراحت',
};

function getAgentTickets(agentId: string) {
  const agent = mockUsers.find((u) => u.id === agentId);
  if (!agent) return [];
  return mockTickets.filter((t) => t.followUpOwner === agent.fullName || t.complaintOwner === agent.fullName);
}

function computeShiftSummary(agentId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const agent = mockUsers.find((u) => u.id === agentId);
  if (!agent) {
    return { callsHandledToday: 0, ticketsResolvedToday: 0, avgHandleTimeSec: 0, currentStatusDurationSec: 0 };
  }
  const agentTickets = getAgentTickets(agentId);
  const resolvedToday = agentTickets.filter(
    (t) => t.closedAt && t.closedAt >= today && t.status === 'closed'
  ).length;
  return {
    callsHandledToday: 12,
    ticketsResolvedToday: resolvedToday,
    avgHandleTimeSec: 420,
    currentStatusDurationSec: 0,
  };
}

function computeWorkQueue(agentId: string) {
  const agentTickets = getAgentTickets(agentId);
  return agentTickets
    .filter((t) => t.status !== 'closed')
    .map((ticket) => ({
      ticket,
      isOverdue: ticket.status !== 'closed' && ticket.slaRemainingDays < 0,
      isHighPriority: ticket.enrichment?.priority === 'high',
      isNegativeSentiment: ticket.enrichment?.sentiment === 'negative',
      slaRemainingDays: ticket.slaRemainingDays,
    }));
}

let currentStatus: AgentStatus = 'ready';
let statusSince = new Date();

export class MockAgentWorkspaceRepository implements AgentWorkspaceRepository {
  async getWorkspaceData(_agentId: string): Promise<AgentWorkspaceData> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const workQueue = computeWorkQueue(_agentId);
    const shiftSummary = computeShiftSummary(_agentId);

    const shiftState: AgentShiftState = {
      status: currentStatus,
      statusSince,
      statusLabel: AGENT_STATUS_LABELS[currentStatus],
    };

    const nextAction = computeNextAction(workQueue);

    return {
      shiftState,
      nextAction,
      workQueue,
      shiftSummary: { ...shiftSummary, currentStatusDurationSec: Math.floor((Date.now() - statusSince.getTime()) / 1000) },
    };
  }

  async updateAgentStatus(_agentId: string, status: AgentStatus): Promise<AgentShiftState> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    currentStatus = status;
    statusSince = new Date();
    return {
      status: currentStatus,
      statusSince,
      statusLabel: AGENT_STATUS_LABELS[currentStatus],
    };
  }
}