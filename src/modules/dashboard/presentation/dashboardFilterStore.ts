import { create } from 'zustand';
import {
  removeFilter,
  toggleFilter,
  type DashboardFilters,
  type Dimension,
} from '../domain/filters';

interface DashboardFilterState {
  filters: DashboardFilters;
  toggle: (dimension: Dimension, value: string) => void;
  remove: (dimension: Dimension) => void;
  clear: () => void;
}

/** Shared filter state every dashboard chart reads and writes (cross-filtering). Rules live in domain/filters.ts. */
export const useDashboardFilterStore = create<DashboardFilterState>((set) => ({
  filters: {},
  toggle: (dimension, value) =>
    set((state) => ({ filters: toggleFilter(state.filters, dimension, value) })),
  remove: (dimension) => set((state) => ({ filters: removeFilter(state.filters, dimension) })),
  clear: () => set({ filters: {} }),
}));
