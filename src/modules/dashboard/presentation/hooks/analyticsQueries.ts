import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DashboardScope, Dimension } from '../../domain/filters';
import { useAnalyticsRepository } from '../analyticsServices';

export const analyticsKeys = {
  all: ['analytics'] as const,
  kpis: (scope: DashboardScope) => [...analyticsKeys.all, 'kpis', scope] as const,
  breakdown: (dimension: Dimension, scope: DashboardScope) =>
    [...analyticsKeys.all, 'breakdown', dimension, scope] as const,
  cross: (row: Dimension, column: Dimension, scope: DashboardScope) =>
    [...analyticsKeys.all, 'cross', row, column, scope] as const,
  subjects: (scope: DashboardScope) => [...analyticsKeys.all, 'subjects', scope] as const,
  subjectLines: (scope: DashboardScope) => [...analyticsKeys.all, 'subjectLines', scope] as const,
  trend: (dimension: Dimension, scope: DashboardScope) =>
    [...analyticsKeys.all, 'trend', dimension, scope] as const,
  operators: (scope: DashboardScope) => [...analyticsKeys.all, 'operators', scope] as const,
  calls: (scope: DashboardScope) => [...analyticsKeys.all, 'calls', scope] as const,
  heatmap: (scope: DashboardScope) => [...analyticsKeys.all, 'heatmap', scope] as const,
  repeatCalls: (scope: DashboardScope) => [...analyticsKeys.all, 'repeatCalls', scope] as const,
  sentiment: (scope: DashboardScope) => [...analyticsKeys.all, 'sentiment', scope] as const,
  detection: (scope: DashboardScope) => [...analyticsKeys.all, 'detection', scope] as const,
  reasons: (scope: DashboardScope) => [...analyticsKeys.all, 'reasons', scope] as const,
  branchResponseTime: (scope: DashboardScope) =>
    [...analyticsKeys.all, 'branchResponseTime', scope] as const,
};

const shared = { placeholderData: keepPreviousData } as const;

export function useKpis(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.kpis(scope),
    queryFn: () => repository.getKpis(scope),
    ...shared,
  });
}

export function useBreakdown(dimension: Dimension, scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.breakdown(dimension, scope),
    queryFn: () => repository.getBreakdown(dimension, scope),
    ...shared,
  });
}

export function useCrossBreakdown(row: Dimension, column: Dimension, scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.cross(row, column, scope),
    queryFn: () => repository.getCrossBreakdown(row, column, scope),
    ...shared,
  });
}

export function useSubjectTable(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.subjects(scope),
    queryFn: () => repository.getSubjectTable(scope),
    ...shared,
  });
}

export function useSubjectLineTable(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.subjectLines(scope),
    queryFn: () => repository.getSubjectLineTable(scope),
    ...shared,
  });
}

export function useTrend(dimension: Dimension, scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.trend(dimension, scope),
    queryFn: () => repository.getTrend(dimension, scope),
    ...shared,
  });
}

export function useOperatorStats(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.operators(scope),
    queryFn: () => repository.getOperatorStats(scope),
    ...shared,
  });
}

export function useCallStats(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.calls(scope),
    queryFn: () => repository.getCallStats(scope),
    ...shared,
  });
}

export function useCallHeatmap(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.heatmap(scope),
    queryFn: () => repository.getCallHeatmap(scope),
    ...shared,
  });
}

export function useRepeatCalls(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.repeatCalls(scope),
    queryFn: () => repository.getRepeatCalls(scope),
    ...shared,
  });
}

export function useSentimentOverview(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.sentiment(scope),
    queryFn: () => repository.getSentimentOverview(scope),
    ...shared,
  });
}

export function useSubjectDetection(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.detection(scope),
    queryFn: () => repository.getSubjectDetection(scope),
    ...shared,
  });
}

export function useCallReasons(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.reasons(scope),
    queryFn: () => repository.getCallReasons(scope),
    ...shared,
  });
}

export function useBranchResponseTime(scope: DashboardScope) {
  const repository = useAnalyticsRepository();
  return useQuery({
    queryKey: analyticsKeys.branchResponseTime(scope),
    queryFn: () => repository.getBranchResponseTime(scope),
    ...shared,
  });
}
