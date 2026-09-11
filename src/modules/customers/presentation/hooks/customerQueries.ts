import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CustomerQuery } from '../../domain/CustomerRepository';
import { useCustomerRepository } from '../customerServices';

export const customerKeys = {
  all: ['customers'] as const,
  list: (query: CustomerQuery) => [...customerKeys.all, 'list', query] as const,
  profile: (nationalId: string) => [...customerKeys.all, 'profile', nationalId] as const,
  interactions: (nationalId: string) => [...customerKeys.all, 'interactions', nationalId] as const,
  sentiment: (nationalId: string) => [...customerKeys.all, 'sentiment', nationalId] as const,
};

export function useCustomers(query: CustomerQuery) {
  const repository = useCustomerRepository();
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: () => repository.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerProfile(nationalId: string) {
  const repository = useCustomerRepository();
  return useQuery({
    queryKey: customerKeys.profile(nationalId),
    queryFn: () => repository.getProfile(nationalId),
  });
}

export function useCustomerInteractions(nationalId: string) {
  const repository = useCustomerRepository();
  return useQuery({
    queryKey: customerKeys.interactions(nationalId),
    queryFn: () => repository.getInteractions(nationalId),
  });
}

export function useSentimentHistory(nationalId: string) {
  const repository = useCustomerRepository();
  return useQuery({
    queryKey: customerKeys.sentiment(nationalId),
    queryFn: () => repository.getSentimentHistory(nationalId),
  });
}
