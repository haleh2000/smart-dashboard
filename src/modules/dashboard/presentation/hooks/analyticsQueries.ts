import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DashboardFilters, Dimension } from '../../domain/filters';
import { useAnalyticsRepository } from '../analyticsServices';

export const analyticsKeys = {
  all: ['analytics'] as const,
  breakdown: (dimension: Dimension, filters: DashboardFilters) =>
    [...analyticsKeys.all, 'breakdown', dimension, filters] as const,
  kpis: (filters: DashboardFilters) => [...analyticsKeys.all, 'kpis', filters] as const,
};

export function useBreakdown(dimension: Dimension, filters: DashboardFilters) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.breakdown(dimension, filters),
    queryFn: () => repository.getBreakdown(dimension, filters),
    placeholderData: keepPreviousData,
  });
}

export function useKpis(filters: DashboardFilters) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.kpis(filters),
    queryFn: () => repository.getKpis(filters),
    placeholderData: keepPreviousData,
  });
}
