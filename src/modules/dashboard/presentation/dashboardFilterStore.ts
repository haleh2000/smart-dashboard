import { useMemo } from 'react';
import { create } from 'zustand';
import { periodRange, type DateRange, type Period } from '@/shared/domain/period';
import {
  removeFilter,
  selectSubject,
  toggleFilter,
  type DashboardFilters,
  type DashboardScope,
  type Dimension,
} from '../domain/filters';

interface DashboardFilterState {
  filters: DashboardFilters;
  period: Period;

  customRange: DateRange | null;
  toggle: (dimension: Dimension, value: string) => void;
  togglePair: (a: [Dimension, string], b: [Dimension, string]) => void;
  selectSubject: (path: readonly string[]) => void;
  remove: (dimension: Dimension) => void;
  clear: () => void;
  setDimension: (dimension: Dimension, value?: string) => void;
  setPeriod: (period: Period) => void;
  setCustomRange: (range: DateRange) => void;
  clearCustomRange: () => void;
}

const initialState = {
  filters: {} as DashboardFilters,
  period: 'all' as Period,
  customRange: null as DateRange | null,    
};

export const useDashboardFilterStore = create<DashboardFilterState>((set) => ({
  ...initialState,
  toggle: (dimension, value) =>
    set((state) => {
      const next = toggleFilter(state.filters, dimension, value);
      // شکایت موضوع ندارد؛ انتخاب نوع شکایت فیلترهای موضوع را پاک می‌کند.
      if (dimension === 'type' && value === 'شکایت' && next.type === 'شکایت') {
        const rest = { ...next };
        delete rest.subject1;
        delete rest.subject2;
        delete rest.subject3;
        return { filters: rest };
      }
      return { filters: next };
    }),
  togglePair: ([da, va], [db, vb]) =>
    set((state) => {
      const both = state.filters[da] === va && state.filters[db] === vb;
      const cleared = removeFilter(removeFilter(state.filters, da), db);
      return { filters: both ? cleared : { ...cleared, [da]: va, [db]: vb } };
    }),
  selectSubject: (path) => set((state) => ({ filters: selectSubject(state.filters, path) })),
  remove: (dimension) => set((state) => ({ filters: removeFilter(state.filters, dimension) })),
  clear: () => set({ filters: {} }),
  setDimension: (dimension, value) =>
    set((state) => {
      const next =
        value === undefined
          ? removeFilter(state.filters, dimension)
          : { ...removeFilter(state.filters, dimension), [dimension]: value };
      // شکایت موضوع ندارد؛ انتخاب نوع شکایت فیلترهای موضوع را پاک می‌کند.
      if (dimension === 'type' && value === 'شکایت') {
        const rest = { ...next };
        delete rest.subject1;
        delete rest.subject2;
        delete rest.subject3;
        return { filters: rest };
      }
      return { filters: next };
    }),
  setPeriod: (period) => set({ period, customRange: null }),
  setCustomRange: (customRange) => set({ customRange }),
  clearCustomRange: () => set({ customRange: null }),
}));

export const resetDashboardFilters = () => useDashboardFilterStore.setState(initialState);

export function useDashboardScope(): DashboardScope {
  const filters = useDashboardFilterStore((state) => state.filters);
  const period = useDashboardFilterStore((state) => state.period);
  const customRange = useDashboardFilterStore((state) => state.customRange);
  const presetRange = useMemo(() => periodRange(period), [period]);
  return useMemo(
    () => ({ filters, range: customRange ?? presetRange }),
    [filters, customRange, presetRange],
  );
}
