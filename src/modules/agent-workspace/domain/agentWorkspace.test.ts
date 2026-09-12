import { describe, it, expect } from 'vitest';
import {
  isTicketOverdue,
  isTicketHighPriority,
  isTicketNegativeSentiment,
  computeNextAction,
  formatStatusDuration,
} from './agentWorkspace';
import type { Ticket } from '@/modules/tickets';
import type { TranscriptLine } from '@/shared/domain/insights';

const createMockTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 'T-1001',
  createdAt: new Date('2024-01-15T10:00:00'),
  type: 'گفت‌وگو',
  status: 'inProgress',
  channel: 'تلفن',
  customer: {
    nationalId: '0012345678',
    mobile: '09123456789',
    fullName: 'محمد محمدی',
  },
  subject: { level1: 'پس از صدور', level2: 'اعلام خسارت', level3: 'ثبت پرونده خسارت' },
  insuranceLine: 'بدنه خودرو',
  branch: 'تهران',
  complaintOwner: 'سارا احمدی',
  followUpOwner: 'سارا احمدی',
  complaintText: 'مشتری پیگیری خسارت دارد',
  slaRemainingDays: 2,
  referralCount: 0,
  starred: false,
  enrichment: {
    sentiment: 'neutral',
    priority: 'medium',
    aiTags: [],
    autoLabel: 'پیگیری خسارت',
    topic: 'اعلام خسارت',
    transcript: [] as TranscriptLine[],
  },
  ...overrides,
});

describe('agentWorkspace domain', () => {
  describe('isTicketOverdue', () => {
    it('returns true for open ticket with negative SLA days', () => {
      const ticket = createMockTicket({ status: 'inProgress', slaRemainingDays: -2 });
      expect(isTicketOverdue(ticket)).toBe(true);
    });

    it('returns false for closed ticket even with negative SLA days', () => {
      const ticket = createMockTicket({ status: 'closed', slaRemainingDays: -2 });
      expect(isTicketOverdue(ticket)).toBe(false);
    });

    it('returns false for open ticket with positive SLA days', () => {
      const ticket = createMockTicket({ status: 'inProgress', slaRemainingDays: 3 });
      expect(isTicketOverdue(ticket)).toBe(false);
    });
  });

  describe('isTicketHighPriority', () => {
    it('returns true when enrichment priority is high', () => {
      const ticket = createMockTicket({
        enrichment: { ...createMockTicket().enrichment!, priority: 'high' },
      });
      expect(isTicketHighPriority(ticket)).toBe(true);
    });

    it('returns false when enrichment priority is not high', () => {
      const ticket = createMockTicket({
        enrichment: { ...createMockTicket().enrichment!, priority: 'medium' },
      });
      expect(isTicketHighPriority(ticket)).toBe(false);
    });

    it('returns false when enrichment is null', () => {
      const ticket = createMockTicket({ enrichment: null });
      expect(isTicketHighPriority(ticket)).toBe(false);
    });
  });

  describe('isTicketNegativeSentiment', () => {
    it('returns true when enrichment sentiment is negative', () => {
      const ticket = createMockTicket({
        enrichment: { ...createMockTicket().enrichment!, sentiment: 'negative' },
      });
      expect(isTicketNegativeSentiment(ticket)).toBe(true);
    });

    it('returns false when enrichment sentiment is not negative', () => {
      const ticket = createMockTicket({
        enrichment: { ...createMockTicket().enrichment!, sentiment: 'positive' },
      });
      expect(isTicketNegativeSentiment(ticket)).toBe(false);
    });

    it('returns false when enrichment is null', () => {
      const ticket = createMockTicket({ enrichment: null });
      expect(isTicketNegativeSentiment(ticket)).toBe(false);
    });
  });

  describe('computeNextAction', () => {
    it('returns SLA warning for overdue tickets', () => {
      const workQueue = [
        {
          ticket: createMockTicket({ id: 'T-1001', slaRemainingDays: -2, status: 'inProgress' }),
          isOverdue: true,
          isHighPriority: false,
          isNegativeSentiment: false,
          slaRemainingDays: -2,
        },
        {
          ticket: createMockTicket({ id: 'T-1002', slaRemainingDays: -5, status: 'pending' }),
          isOverdue: true,
          isHighPriority: false,
          isNegativeSentiment: false,
          slaRemainingDays: -5,
        },
      ];
      const action = computeNextAction(workQueue);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('slaWarning');
      expect(action?.ticketId).toBe('T-1002'); // Most overdue
      expect(action?.severity).toBe('high');
    });

    it('returns negative sentiment for high priority negative tickets', () => {
      const workQueue = [
        {
          ticket: createMockTicket({
            id: 'T-1001',
            enrichment: { ...createMockTicket().enrichment!, sentiment: 'negative', priority: 'high' },
            slaRemainingDays: 2,
            status: 'inProgress',
          }),
          isOverdue: false,
          isHighPriority: true,
          isNegativeSentiment: true,
          slaRemainingDays: 2,
        },
      ];
      const action = computeNextAction(workQueue);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('negativeSentiment');
      expect(action?.severity).toBe('high');
    });

    it('returns high priority for high priority tickets', () => {
      const workQueue = [
        {
          ticket: createMockTicket({
            id: 'T-1001',
            enrichment: { ...createMockTicket().enrichment!, priority: 'high' },
            slaRemainingDays: 2,
            status: 'inProgress',
          }),
          isOverdue: false,
          isHighPriority: true,
          isNegativeSentiment: false,
          slaRemainingDays: 2,
        },
      ];
      const action = computeNextAction(workQueue);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('highPriority');
      expect(action?.severity).toBe('medium');
    });

    it('returns follow up for tickets with followUpRequest', () => {
      const workQueue = [
        {
          ticket: createMockTicket({
            id: 'T-1001',
            followUpRequest: 'بررسی مجدد مدارک',
            slaRemainingDays: 2,
            status: 'inProgress',
          }),
          isOverdue: false,
          isHighPriority: false,
          isNegativeSentiment: false,
          slaRemainingDays: 2,
        },
      ];
      const action = computeNextAction(workQueue);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('followUp');
      expect(action?.description).toBe('بررسی مجدد مدارک');
    });

    it('returns null for empty work queue', () => {
      const action = computeNextAction([]);
      expect(action).toBeNull();
    });
  });

  describe('formatStatusDuration', () => {
    it('formats seconds correctly', () => {
      const start = new Date(Date.now() - 30 * 1000);
      expect(formatStatusDuration(start)).toBe('30ث');
    });

    it('formats minutes correctly', () => {
      const start = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatStatusDuration(start)).toBe('5د 0ث');
    });

    it('formats hours correctly', () => {
      const start = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatStatusDuration(start)).toBe('2س 0د');
    });
  });
});