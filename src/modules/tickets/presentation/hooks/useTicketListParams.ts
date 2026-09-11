import { useSearchParams } from 'react-router';
import {
  parseTicketListParams,
  serializeTicketListParams,
  toTicketQuery,
  type TicketListState,
} from './ticketListParams';

export type TicketListChanges = Partial<TicketListState>;

/**
 * Ticket list state lives in the URL, so reload / back-navigation from the detail page
 * restores the same view and links can be shared.
 */
export function useTicketListParams() {
  const [params, setParams] = useSearchParams();
  const state = parseTicketListParams(params);

  /** Any change other than paging starts again from page 1. */
  const update = (changes: TicketListChanges) =>
    setParams(serializeTicketListParams({ ...state, page: 1, ...changes }));

  return { state, query: toTicketQuery(state), update, search: params.toString() };
}
