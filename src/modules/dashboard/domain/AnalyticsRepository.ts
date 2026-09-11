import type {
  BreakdownItem,
  CallReasons,
  CallStats,
  CrossBreakdown,
  Heatmap,
  Kpis,
  OperatorStats,
  RepeatCallStats,
  SentimentOverview,
  SubjectDetectionStats,
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
  /** Customer and operator sentiment of the analyzed calls. */
  getSentimentOverview(scope: DashboardScope): Promise<SentimentOverview>;
  /** Operator categorization vs. AI subject detection. */
  getSubjectDetection(scope: DashboardScope): Promise<SubjectDetectionStats>;
  /** Multi-level call reasons (Subject1 → 2 → 3), largest first at every level. */
  getCallReasons(scope: DashboardScope): Promise<CallReasons>;
}
