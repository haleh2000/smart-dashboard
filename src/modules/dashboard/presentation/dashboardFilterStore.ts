import { useMemo } from 'react';
import { create } from 'zustand';
import { periodRange, type Period } from '@/shared/domain/period';
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
  toggle: (dimension: Dimension, value: string) => void;
  /** Toggles two dimensions at once (stacked-bar segment, heatmap cell). */
  togglePair: (a: [Dimension, string], b: [Dimension, string]) => void;
  selectSubject: (path: readonly string[]) => void;
  remove: (dimension: Dimension) => void;
  clear: () => void;
  setPeriod: (period: Period) => void;
}

const initialState = { filters: {} as DashboardFilters, period: '30d' as Period };

/** Shared filter state every dashboard chart reads and writes (cross-filtering). Rules live in domain/filters.ts. */
export const useDashboardFilterStore = create<DashboardFilterState>((set) => ({
  ...initialState,
  toggle: (dimension, value) =>
    set((state) => ({ filters: toggleFilter(state.filters, dimension, value) })),
  togglePair: ([da, va], [db, vb]) =>
    set((state) => {
      const both = state.filters[da] === va && state.filters[db] === vb;
      const cleared = removeFilter(removeFilter(state.filters, da), db);
      return { filters: both ? cleared : { ...cleared, [da]: va, [db]: vb } };
    }),
  selectSubject: (path) => set((state) => ({ filters: selectSubject(state.filters, path) })),
  remove: (dimension) => set((state) => ({ filters: removeFilter(state.filters, dimension) })),
  clear: () => set({ filters: {} }),
  setPeriod: (period) => set({ period }),
}));

/** Restores the initial state (tests). */
export const resetDashboardFilters = () => useDashboardFilterStore.setState(initialState);

/** The scope every analytics query runs with: cross-filters + the time filter as dates. */
export function useDashboardScope(): DashboardScope {
  const filters = useDashboardFilterStore((state) => state.filters);
  const period = useDashboardFilterStore((state) => state.period);
  return useMemo(() => ({ filters, range: periodRange(period) }), [filters, period]);
}
