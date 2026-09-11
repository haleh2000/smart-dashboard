import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { Page, Sort } from '@/shared/domain/pagination';
import type { Ticket, TicketNote } from '../../domain/ticket';
import type { TicketFilter, TicketQuery, TicketSortField } from '../../domain/TicketRepository';
import { useTicketRepository } from '../ticketServices';

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (query: TicketQuery) => [...ticketKeys.lists(), query] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
  filterOptions: () => [...ticketKeys.all, 'filterOptions'] as const,
  adjacent: (id: string, filter: TicketFilter, sort: Sort<TicketSortField>) =>
    [...ticketKeys.detail(id), 'adjacent', filter, sort] as const,
  timeline: (id: string) => [...ticketKeys.detail(id), 'timeline'] as const,
  updates: (id: string) => [...ticketKeys.detail(id), 'updates'] as const,
  notes: (id: string) => [...ticketKeys.detail(id), 'notes'] as const,
  documents: (id: string) => [...ticketKeys.detail(id), 'documents'] as const,
};

export function useTickets(query: TicketQuery) {
  const repository = useTicketRepository();
  return useQuery({
    queryKey: ticketKeys.list(query),
    queryFn: () => repository.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useTicket(id: string) {
  const repository = useTicketRepository();
  return useQuery({ queryKey: ticketKeys.detail(id), queryFn: () => repository.getById(id) });
}

export function useTicketFilterOptions() {
  const repository = useTicketRepository();
  return useQuery({
    queryKey: ticketKeys.filterOptions(),
    queryFn: () => repository.getFilterOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useAdjacentTickets(id: string, filter: TicketFilter, sort: Sort<TicketSortField>) {
  const repository = useTicketRepository();
  return useQuery({
    queryKey: ticketKeys.adjacent(id, filter, sort),
    queryFn: () => repository.getAdjacent(id, filter, sort),
  });
}

export function useTicketTimeline(id: string) {
  const repository = useTicketRepository();
  return useQuery({ queryKey: ticketKeys.timeline(id), queryFn: () => repository.getTimeline(id) });
}

export function useTicketUpdates(id: string) {
  const repository = useTicketRepository();
  return useQuery({ queryKey: ticketKeys.updates(id), queryFn: () => repository.getUpdates(id) });
}

export function useTicketNotes(id: string) {
  const repository = useTicketRepository();
  return useQuery({ queryKey: ticketKeys.notes(id), queryFn: () => repository.getNotes(id) });
}

export function useTicketDocuments(id: string) {
  const repository = useTicketRepository();
  return useQuery({
    queryKey: ticketKeys.documents(id),
    queryFn: () => repository.getDocuments(id),
  });
}

export function useAddTicketNote(id: string) {
  const repository = useTicketRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => repository.addNote(id, text),
    onSuccess: (note) => {
      queryClient.setQueryData<TicketNote[]>(ticketKeys.notes(id), (notes = []) => [
        note,
        ...notes,
      ]);
      void queryClient.invalidateQueries({ queryKey: ticketKeys.timeline(id) });
    },
  });
}

/** Largest page the export asks for. When api.yml defines a server-side export, call it instead. */
const EXPORT_LIMIT = 10_000;

/** Fetches every ticket matching the list filters (not just the visible page) for the Excel export. */
export function useTicketExport() {
  const repository = useTicketRepository();
  return useMutation({
    mutationFn: async (query: TicketQuery) =>
      (await repository.list({ ...query, page: 1, pageSize: EXPORT_LIMIT })).items,
  });
}

const patchTicket = (queryClient: QueryClient, id: string, patch: Partial<Ticket>) => {
  queryClient.setQueriesData<Page<Ticket>>(
    { queryKey: ticketKeys.lists() },
    (page) =>
      page && {
        ...page,
        items: page.items.map((ticket) => (ticket.id === id ? { ...ticket, ...patch } : ticket)),
      },
  );
  queryClient.setQueryData<Ticket | null>(ticketKeys.detail(id), (ticket) =>
    ticket ? { ...ticket, ...patch } : ticket,
  );
};

/** «ستاره‌دار کردن» with an optimistic update, rolled back if the server refuses. */
export function useToggleStar() {
  const repository = useTicketRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) =>
      repository.setStarred(id, starred),
    onMutate: ({ id, starred }) => patchTicket(queryClient, id, { starred }),
    onError: (_error, { id, starred }) => patchTicket(queryClient, id, { starred: !starred }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ticketKeys.lists() }),
  });
}
