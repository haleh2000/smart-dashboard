import { delay } from '@/mocks/delay';
import { createRandom } from '@/mocks/random';
import { agents } from '@/mocks/reference';
import { mockTickets } from '@/mocks/tickets';
import type { Page, Sort } from '@/shared/domain/pagination';
import { isWithinRange } from '@/shared/domain/period';
import { PRIORITIES, SENTIMENTS } from '@/shared/domain/insights';
import type {
  Ticket,
  TicketDocument,
  TicketEvent,
  TicketNote,
  TicketUpdate,
} from '../domain/ticket';
import type {
  AdjacentTickets,
  TicketFilter,
  TicketFilterOptions,
  TicketQuery,
  TicketRepository,
  TicketSortField,
} from '../domain/TicketRepository';

const HOUR = 60 * 60 * 1000;

const sortValue: Record<TicketSortField, (t: Ticket) => string | number> = {
  id: (t) => t.id,
  createdAt: (t) => t.createdAt.getTime(),
  type: (t) => t.type,
  status: (t) => t.status,
  mobile: (t) => t.customer.mobile,
  nationalId: (t) => t.customer.nationalId,
  subject1: (t) => t.subject.level1,
  subject2: (t) => t.subject.level2,
  subject3: (t) => t.subject.level3,
  followUpOwner: (t) => t.followUpOwner,
  branch: (t) => t.branch,
  complaintOwner: (t) => t.complaintOwner,
  // Missing enrichment sorts before everything else.
  sentiment: (t) => (t.enrichment ? SENTIMENTS.indexOf(t.enrichment.sentiment) : -1),
  priority: (t) => (t.enrichment ? PRIORITIES.indexOf(t.enrichment.priority) : -1),
};

const compare = (a: Ticket, b: Ticket, { field, direction }: Sort<TicketSortField>) => {
  const x = sortValue[field](a);
  const y = sortValue[field](b);
  const result =
    typeof x === 'number' && typeof y === 'number'
      ? x - y
      : String(x).localeCompare(String(y), 'fa');
  return (direction === 'asc' ? 1 : -1) * (result || a.id.localeCompare(b.id));
};

const matches = (ticket: Ticket, filter: TicketFilter) => {
  const term = filter.search?.trim();
  return (
    (!term ||
      [
        ticket.id,
        ticket.customer.mobile,
        ticket.customer.nationalId,
        ticket.customer.fullName,
      ].some((value) => value.includes(term))) &&
    (!filter.status || ticket.status === filter.status) &&
    (!filter.priority || ticket.enrichment?.priority === filter.priority) &&
    (!filter.sentiment || ticket.enrichment?.sentiment === filter.sentiment) &&
    (!filter.type || ticket.type === filter.type) &&
    (!filter.subject1 || ticket.subject.level1 === filter.subject1) &&
    (!filter.branch || ticket.branch === filter.branch) &&
    (!filter.operator ||
      ticket.followUpOwner === filter.operator ||
      ticket.complaintOwner.endsWith(filter.operator)) &&
    isWithinRange(ticket.createdAt, filter.createdIn) &&
    (!filter.starredOnly || ticket.starred)
  );
};

const distinct = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, 'fa'));

/** Deterministic CRM history for a ticket, derived from its id. */
const historyOf = (ticket: Ticket) => {
  const random = createRandom(Number(ticket.id) || 1);
  const start = ticket.createdAt.getTime();
  const at = (hours: number) => new Date(Math.min(start + hours * HOUR, Date.now()));
  const events: TicketEvent[] = [
    {
      id: 'e1',
      at: at(0),
      kind: 'created',
      actor: 'CRM',
      description: `ثبت تیکت از کانال «${ticket.channel}»`,
    },
    {
      id: 'e2',
      at: at(0.3),
      kind: 'assigned',
      actor: 'سیستم',
      description: `ارجاع به ${ticket.followUpOwner}`,
    },
  ];
  const updates: TicketUpdate[] = [
    { id: 'u1', at: at(0.3), actor: 'سیستم', field: 'مالک پیگیری', to: ticket.followUpOwner },
  ];
  if (ticket.enrichment?.voice)
    events.push({
      id: 'e3',
      at: at(1),
      kind: 'call',
      actor: ticket.followUpOwner,
      description: 'تماس با مشتری و ضبط مکالمه',
    });
  for (let i = 0; i < ticket.referralCount; i += 1) {
    const to = random.pick(agents);
    events.push({
      id: `r${i}`,
      at: at(4 + i * 20),
      kind: 'referred',
      actor: ticket.followUpOwner,
      description: `ارجاع به ${to}`,
    });
    updates.push({
      id: `ur${i}`,
      at: at(4 + i * 20),
      actor: ticket.followUpOwner,
      field: 'مالک پیگیری',
      from: ticket.followUpOwner,
      to,
    });
  }
  if (ticket.firstResponseAt)
    events.push({
      id: 'e4',
      at: ticket.firstResponseAt,
      kind: 'responded',
      actor: ticket.followUpOwner,
      description: 'اولین پاسخ به مشتری',
    });
  if (ticket.status !== 'pending') {
    updates.push({
      id: 'us',
      at: at(6),
      actor: ticket.followUpOwner,
      field: 'وضعیت',
      from: 'در انتظار',
      to: 'در جریان',
    });
    events.push({
      id: 'e5',
      at: at(6),
      kind: 'statusChanged',
      actor: ticket.followUpOwner,
      description: 'تغییر وضعیت به «در جریان»',
    });
  }
  if (ticket.closedAt) {
    events.push({
      id: 'e6',
      at: ticket.closedAt,
      kind: 'closed',
      actor: ticket.followUpOwner,
      description: 'بستن تیکت و ارسال پاسخ نهایی',
    });
    updates.push({
      id: 'uc',
      at: ticket.closedAt,
      actor: ticket.followUpOwner,
      field: 'وضعیت',
      from: 'در جریان',
      to: 'بسته‌شده',
    });
  }
  const byTime = <T extends { at: Date }>(items: T[]) =>
    items.sort((a, b) => a.at.getTime() - b.at.getTime());
  const documents: TicketDocument[] =
    ticket.subject.level1 === 'پس از صدور'
      ? [
          {
            id: 'd1',
            name: 'کروکی-حادثه.pdf',
            sizeBytes: 420_000 + Math.floor(random.next() * 900_000),
            uploadedAt: at(0.5),
          },
          { id: 'd2', name: 'تصویر-کارت-ملی.jpg', sizeBytes: 180_000, uploadedAt: at(0.6) },
        ]
      : [];
  const notes: TicketNote[] =
    random.next() < 0.5
      ? [
          {
            id: 'n1',
            at: at(2),
            author: ticket.followUpOwner,
            text: 'با مشتری تماس گرفته شد؛ منتظر ارسال مدارک تکمیلی هستیم.',
          },
        ]
      : [];
  return { events: byTime(events), updates: byTime(updates), documents, notes };
};

/** In-memory adapter. Filtering/sorting/paging here mimics what the backend is expected to do. */
export class MockTicketRepository implements TicketRepository {
  private readonly tickets: Ticket[];
  private readonly addedNotes = new Map<string, TicketNote[]>();

  constructor(tickets: Ticket[] = mockTickets) {
    this.tickets = tickets.map((ticket) => ({ ...ticket }));
  }

  private filtered(filter: TicketFilter, sort: Sort<TicketSortField>) {
    return this.tickets
      .filter((ticket) => matches(ticket, filter))
      .sort((a, b) => compare(a, b, sort));
  }

  private find(id: string) {
    return this.tickets.find((ticket) => ticket.id === id);
  }

  async list({ page, pageSize, sort, ...filter }: TicketQuery): Promise<Page<Ticket>> {
    await delay();
    const filtered = this.filtered(filter, sort);
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async getById(id: string) {
    await delay();
    return this.find(id) ?? null;
  }

  async getFilterOptions(): Promise<TicketFilterOptions> {
    await delay(100);
    return {
      types: distinct(this.tickets.map((t) => t.type)),
      subjects: distinct(this.tickets.map((t) => t.subject.level1)),
      branches: distinct(this.tickets.map((t) => t.branch)),
      operators: distinct(this.tickets.map((t) => t.followUpOwner)),
    };
  }

  async getAdjacent(
    id: string,
    filter: TicketFilter,
    sort: Sort<TicketSortField>,
  ): Promise<AdjacentTickets> {
    await delay(100);
    const ids = this.filtered(filter, sort).map((ticket) => ticket.id);
    const index = ids.indexOf(id);
    if (index === -1) return { previousId: null, nextId: null };
    return { previousId: ids[index - 1] ?? null, nextId: ids[index + 1] ?? null };
  }

  async getTimeline(id: string) {
    await delay();
    const ticket = this.find(id);
    if (!ticket) return [];
    const notes = (this.addedNotes.get(id) ?? []).map<TicketEvent>((note) => ({
      id: `note-${note.id}`,
      at: note.at,
      kind: 'responded',
      actor: note.author,
      description: 'ثبت یادداشت داخلی',
    }));
    return [...historyOf(ticket).events, ...notes];
  }

  async getUpdates(id: string) {
    await delay();
    const ticket = this.find(id);
    return ticket ? historyOf(ticket).updates : [];
  }

  async getNotes(id: string) {
    await delay();
    const ticket = this.find(id);
    if (!ticket) return [];
    return [...(this.addedNotes.get(id) ?? []), ...historyOf(ticket).notes].sort(
      (a, b) => b.at.getTime() - a.at.getTime(),
    );
  }

  async addNote(id: string, text: string) {
    await delay(300);
    // The real API takes the author from the session; the mock can't know it.
    const note: TicketNote = {
      id: crypto.randomUUID(),
      at: new Date(),
      author: 'کاربر فعلی',
      text: text.trim(),
    };
    this.addedNotes.set(id, [note, ...(this.addedNotes.get(id) ?? [])]);
    return note;
  }

  async getDocuments(id: string) {
    await delay();
    const ticket = this.find(id);
    return ticket ? historyOf(ticket).documents : [];
  }

  async setStarred(id: string, starred: boolean) {
    await delay(150);
    const ticket = this.find(id);
    if (ticket) ticket.starred = starred;
  }
}
