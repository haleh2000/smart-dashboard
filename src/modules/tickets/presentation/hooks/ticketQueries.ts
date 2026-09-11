import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { TicketQuery } from '../../domain/TicketRepository';
import { useTicketRepository } from '../ticketServices';

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (query: TicketQuery) => [...ticketKeys.all, 'list', query] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
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
