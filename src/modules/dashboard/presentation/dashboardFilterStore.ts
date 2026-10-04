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
  /**
   * Hand-picked «بازه دلخواه» (day + hour). While set it wins over `period`;
   * `null` means the preset buttons above drive the range.
   */
  customRange: DateRange | null;
  toggle: (dimension: Dimension, value: string) => void;
  /** Toggles two dimensions at once (stacked-bar segment, heatmap cell). */
  togglePair: (a: [Dimension, string], b: [Dimension, string]) => void;
  selectSubject: (path: readonly string[]) => void;
  remove: (dimension: Dimension) => void;
  clear: () => void;
  setPeriod: (period: Period) => void;
  setCustomRange: (range: DateRange) => void;
  clearCustomRange: () => void;
}

/**
 * The time filter starts at «همه زمان‌ها», the default of the ticket table too, so the KPI cards
 * count exactly the rows the table shows (README → «جدول تیکت‌ها منبع اصلی محاسبه KPIها»).
 */
const initialState = {
  filters: {} as DashboardFilters,
  period: 'all' as Period,
  customRange: null as DateRange | null,
};

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
  /** A preset always wins over a hand-picked range, so selecting one drops it. */
  setPeriod: (period) => set({ period, customRange: null }),
  setCustomRange: (customRange) => set({ customRange }),
  clearCustomRange: () => set({ customRange: null }),
}));

/** Restores the initial state (tests). */
export const resetDashboardFilters = () => useDashboardFilterStore.setState(initialState);

/** The scope every analytics query runs with: cross-filters + the time filter as dates. */
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
