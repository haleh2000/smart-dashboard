import type { Ticket } from '@/modules/tickets';

export type AgentStatus = 'ready' | 'inCall' | 'wrapUp' | 'break';

export interface AgentShiftState {
  status: AgentStatus;
  statusSince: Date;
  statusLabel: string;
}

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  ready: 'آماده',
  inCall: 'در تماس',
  wrapUp: 'اتمام تماس',
  break: 'استراحت',
};

export const AGENT_STATUS_TONES: Record<AgentStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  ready: 'success',
  inCall: 'warning',
  wrapUp: 'info',
  break: 'neutral',
};

export interface NextAction {
  type: 'slaWarning' | 'negativeSentiment' | 'highPriority' | 'followUp';
  ticketId: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export interface AgentWorkQueueItem {
  ticket: Ticket;
  isOverdue: boolean;
  isHighPriority: boolean;
  isNegativeSentiment: boolean;
  slaRemainingDays: number;
}

export interface PersonalShiftSummary {
  callsHandledToday: number;
  ticketsResolvedToday: number;
  avgHandleTimeSec: number;
  currentStatusDurationSec: number;
}

export interface AgentWorkspaceData {
  shiftState: AgentShiftState;
  nextAction: NextAction | null;
  workQueue: AgentWorkQueueItem[];
  shiftSummary: PersonalShiftSummary;
}

export interface AgentWorkspaceRepository {
  getWorkspaceData(agentId: string): Promise<AgentWorkspaceData>;
  updateAgentStatus(agentId: string, status: AgentStatus): Promise<AgentShiftState>;
}

export function isTicketOverdue(ticket: Pick<Ticket, 'slaRemainingDays' | 'status'>): boolean {
  return ticket.status !== 'closed' && ticket.slaRemainingDays < 0;
}

export function isTicketHighPriority(ticket: Ticket): boolean {
  return ticket.enrichment?.priority === 'high';
}

export function isTicketNegativeSentiment(ticket: Ticket): boolean {
  return ticket.enrichment?.sentiment === 'negative';
}

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

export function computeNextAction(workQueue: AgentWorkQueueItem[]): NextAction | null {
  const overdueTickets = workQueue.filter((item) => item.isOverdue);
  if (overdueTickets.length > 0) {
    const sorted = overdueTickets.sort((a, b) => a.slaRemainingDays - b.slaRemainingDays);
    const mostUrgent = first(sorted);
    if (mostUrgent) {
      return {
        type: 'slaWarning',
        ticketId: mostUrgent.ticket.id,
        title: 'اخطار SLA',
        description: `تیکت ${mostUrgent.ticket.id} ${Math.abs(mostUrgent.slaRemainingDays)} روز معوق است`,
        severity: 'high',
        createdAt: mostUrgent.ticket.createdAt,
      };
    }
  }

  const negativeSentimentTickets = workQueue.filter((item) => item.isNegativeSentiment && item.isHighPriority);
  if (negativeSentimentTickets.length > 0) {
    const ticket = first(negativeSentimentTickets)?.ticket;
    if (ticket) {
      return {
        type: 'negativeSentiment',
        ticketId: ticket.id,
        title: 'احساسات منفی با اولویت بالا',
        description: `تیکت ${ticket.id} - ${ticket.enrichment?.topic ?? ticket.subject.level2}`,
        severity: 'high',
        createdAt: ticket.createdAt,
      };
    }
  }

  const highPriorityTickets = workQueue.filter((item) => item.isHighPriority);
  if (highPriorityTickets.length > 0) {
    const ticket = first(highPriorityTickets)?.ticket;
    if (ticket) {
      return {
        type: 'highPriority',
        ticketId: ticket.id,
        title: 'اولویت بالا',
        description: `تیکت ${ticket.id} نیاز به رسیدگی فوری دارد`,
        severity: 'medium',
        createdAt: ticket.createdAt,
      };
    }
  }

  const followUpTickets = workQueue.filter((item) => item.ticket.followUpRequest);
  if (followUpTickets.length > 0) {
    const ticket = first(followUpTickets)?.ticket;
    if (ticket) {
      return {
        type: 'followUp',
        ticketId: ticket.id,
        title: 'پیگیری درخواست شده',
        description: ticket.followUpRequest ?? `تیکت ${ticket.id}`,
        severity: 'medium',
        createdAt: ticket.createdAt,
      };
    }
  }

  return null;
}

export function formatStatusDuration(start: Date): string {
  const diffSec = Math.floor((Date.now() - start.getTime()) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  if (hours > 0) return `${hours}س ${minutes}د`;
  if (minutes > 0) return `${minutes}د ${seconds}ث`;
  return `${seconds}ث`;
}