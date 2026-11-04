import type { Priority, Sentiment } from '@/shared/domain/insights';
import {
  hasTicketSubject,
  isClosedDetailStatus,
  isReviewDetailStatus,
  TICKET_STATUSES,
  type Ticket,
  type TicketStatus,
} from './ticket';

/**
 * Exact CRM / Nest `tickets` row shape (snake_case field names).
 * Keep this aligned with voc_panel TicketEntity + the CRM export payload.
 */
export interface CrmTicket {
  ticketid: string;
  ticket_no?: string | null;
  nationalcode?: string | null;
  accountname?: string | null;
  fname?: string | null;
  lname?: string | null;
  mobile?: string | null;
  productname?: string | null;
  branchname?: string | null;
  mainticket?: string | null;
  subticket?: string | null;
  reqtypeticket?: string | null;
  createdtime?: string | Date | null;
  modifiedtime?: string | Date | null;
  tickettype?: string | null;
  inputchannel?: string | null;
  complainttext?: string | null;
  maincomplaint?: string | null;
  complaintstatus?: string | null;
  finalanswer?: string | null;
  closeddate?: string | null;
  description?: string | null;
  mainrequest?: string | null;
  mainoffer?: string | null;
  ownername?: string | null;
  sentiment?: string | null;
  priority?: string | null;
  lat?: number | null;
  lng?: number | null;
}

const blank = (value: string | null | undefined) => {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const toDate = (value: string | Date | null | undefined): Date | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/** CRM sometimes exports «شکایات» for the شکایت module. */
export const normalizeCrmTicketType = (tickettype: string | null | undefined): string => {
  const raw = blank(tickettype) ?? '';
  return raw === 'شکایات' ? 'شکایت' : raw;
};

const mapComplaintStatus = (
  complaintstatus: string | null | undefined,
): { status: TicketStatus; detailStatus?: string } => {
  const raw = blank(complaintstatus);
  if (!raw) return { status: 'pending' };

  if ((TICKET_STATUSES as readonly string[]).includes(raw)) {
    return { status: raw as TicketStatus };
  }

  if (isClosedDetailStatus(raw, 'pending')) {
    return { status: 'closed', detailStatus: raw };
  }
  if (isReviewDetailStatus(raw, 'pending')) {
    return { status: 'inProgress', detailStatus: raw };
  }
  return { status: 'registered', detailStatus: raw };
};

const isSentiment = (value: string): value is Sentiment =>
  value === 'positive' || value === 'neutral' || value === 'negative';

const isPriority = (value: string): value is Priority =>
  value === 'low' || value === 'medium' || value === 'high';

/**
 * Maps a CRM/Nest ticket row onto the SMART UI `Ticket` model.
 * CRM snake_case names → UI camelCase / nested customer + subject.
 */
export const mapCrmTicketToTicket = (crm: CrmTicket): Ticket => {
  const type = normalizeCrmTicketType(crm.tickettype);
  const { status, detailStatus } = mapComplaintStatus(crm.complaintstatus);
  const fname = blank(crm.fname);
  const lname = blank(crm.lname);
  const fullName = [fname, lname].filter(Boolean).join(' ').trim();

  const level1 = blank(crm.maincomplaint) ?? blank(crm.mainticket);
  const level2 = blank(crm.subticket);
  const level3 = blank(crm.reqtypeticket);
  const subject =
    hasTicketSubject(type) && level1
      ? {
          level1,
          level2: level2 ?? 'ندارد',
          level3: level3 ?? 'ندارد',
        }
      : undefined;

  const owner = blank(crm.ownername) ?? '';
  const sentiment = blank(crm.sentiment);
  const priority = blank(crm.priority);

  return {
    id: String(crm.ticketid),
    ticketNo: blank(crm.ticket_no),
    createdAt: toDate(crm.createdtime) ?? new Date(0),
    modifiedAt: toDate(crm.modifiedtime),
    type,
    status,
    detailStatus,
    channel: blank(crm.inputchannel) ?? '',
    customer: {
      nationalId: blank(crm.nationalcode) ?? '',
      mobile: blank(crm.mobile) ?? '',
      fullName,
      firstName: fname,
      lastName: lname,
      corporateName: blank(crm.accountname),
    },
    subject,
    mainComplaint: blank(crm.maincomplaint),
    insuranceLine: blank(crm.productname) ?? '',
    branch: blank(crm.branchname) ?? '',
    complaintOwner: owner,
    followUpOwner: owner,
    complaintText: blank(crm.complainttext) ?? '',
    finalResponse: blank(crm.finalanswer),
    description: blank(crm.description),
    followUpRequest: blank(crm.mainrequest),
    mainOffer: blank(crm.mainoffer),
    closedAt: toDate(crm.closeddate),
    slaRemainingDays: 0,
    referralCount: 0,
    starred: false,
    enrichment:
      sentiment && isSentiment(sentiment)
        ? {
            sentiment,
            priority: priority && isPriority(priority) ? priority : 'medium',
            aiTags: [],
            autoLabel: '',
            topic: level1 ?? type,
            transcript: [],
          }
        : null,
  };
};
