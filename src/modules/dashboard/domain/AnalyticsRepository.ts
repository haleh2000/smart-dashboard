import type {
  BreakdownItem,
  CallStats,
  CrossBreakdown,
  Heatmap,
  Kpis,
  OperatorStats,
  RepeatCallStats,
  SubjectLineTable,
  SubjectRow,
  Trend,
} from './analytics';
import type { DashboardScope, Dimension } from './filters';

/** Port: aggregation belongs to the backend; the dashboard only asks for results. */
export interface AnalyticsRepository {
  getKpis(scope: DashboardScope): Promise<Kpis>;
  /** Items sorted by count, descending. */
  getBreakdown(dimension: Dimension, scope: DashboardScope): Promise<BreakdownItem[]>;
  getCrossBreakdown(
    rowDimension: Dimension,
    columnDimension: Dimension,
    scope: DashboardScope,
  ): Promise<CrossBreakdown>;
  /** Subject3 rows, largest first. */
  getSubjectTable(scope: DashboardScope): Promise<SubjectRow[]>;
  getSubjectLineTable(scope: DashboardScope): Promise<SubjectLineTable>;
  getTrend(dimension: Dimension, scope: DashboardScope): Promise<Trend>;
  /** Busiest operators first. */
  getOperatorStats(scope: DashboardScope): Promise<OperatorStats[]>;
  getCallStats(scope: DashboardScope): Promise<CallStats>;
  getCallHeatmap(scope: DashboardScope): Promise<Heatmap>;
  getRepeatCalls(scope: DashboardScope): Promise<RepeatCallStats>;
}
