import type { ReactNode } from 'react';
import { ErrorState, SkeletonTable } from '@/shared/ui';

interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
}

interface ChartStateProps<T> {
  query: QueryLike<T>;
  isEmpty?: (data: T) => boolean;
  skeletonRows?: number;
  children: (data: T) => ReactNode;
}

/** The designed loading / error / empty states every chart shares. */
export function ChartState<T>({ query, isEmpty, skeletonRows = 4, children }: ChartStateProps<T>) {
  if (query.isPending) return <SkeletonTable rows={skeletonRows} />;
  if (query.isError || query.data === undefined)
    return <ErrorState message="دریافت داده با خطا مواجه شد." onRetry={() => query.refetch()} />;
  if (isEmpty?.(query.data))
    return <p className="panel__empty">داده‌ای برای این فیلترها وجود ندارد.</p>;
  return children(query.data);
}
