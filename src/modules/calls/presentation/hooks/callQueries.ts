import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubjectPath } from '@/shared/domain/insights';
import type { CallQuery } from '../../domain/CallRepository';
import { useCallRepository } from '../callServices';

export const callKeys = {
  all: ['calls'] as const,
  lists: () => [...callKeys.all, 'list'] as const,
  list: (query: CallQuery) => [...callKeys.lists(), query] as const,
  detail: (id: string) => [...callKeys.all, 'detail', id] as const,
  filterOptions: () => [...callKeys.all, 'filterOptions'] as const,
  subjectTree: () => [...callKeys.all, 'subjectTree'] as const,
};

export function useCalls(query: CallQuery) {
  const repository = useCallRepository();
  return useQuery({
    queryKey: callKeys.list(query),
    queryFn: () => repository.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useCall(id: string) {
  const repository = useCallRepository();
  return useQuery({ queryKey: callKeys.detail(id), queryFn: () => repository.getById(id) });
}

export function useCallFilterOptions() {
  const repository = useCallRepository();
  return useQuery({
    queryKey: callKeys.filterOptions(),
    queryFn: () => repository.getFilterOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useSubjectTree() {
  const repository = useCallRepository();
  return useQuery({
    queryKey: callKeys.subjectTree(),
    queryFn: () => repository.getSubjectTree(),
    staleTime: Infinity,
  });
}

/** Saves the 3-level categorization; the detail cache is updated, lists are refetched. */
export function useCategorizeCall() {
  const repository = useCallRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, subject }: { id: string; subject: SubjectPath }) =>
      repository.categorize(id, subject),
    onSuccess: (call) => {
      queryClient.setQueryData(callKeys.detail(call.id), call);
      void queryClient.invalidateQueries({ queryKey: callKeys.lists() });
    },
  });
}
