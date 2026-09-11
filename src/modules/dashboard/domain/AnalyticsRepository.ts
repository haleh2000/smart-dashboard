import type { BreakdownItem, Kpis } from './analytics';
import type { DashboardFilters, Dimension } from './filters';

/** Port: aggregation belongs to the backend; the dashboard only asks for results. */
export interface AnalyticsRepository {
  /** Items sorted by count, descending. */
  getBreakdown(dimension: Dimension, filters: DashboardFilters): Promise<BreakdownItem[]>;
  getKpis(filters: DashboardFilters): Promise<Kpis>;
}
