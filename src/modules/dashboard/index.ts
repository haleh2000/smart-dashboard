// Public API of the dashboard module. Other code imports from "@/modules/dashboard" only.
export type { AnalyticsRepository } from './domain/AnalyticsRepository';
export type { DashboardFilters, DashboardScope, Dimension } from './domain/filters';
export { MockAnalyticsRepository } from './infrastructure/MockAnalyticsRepository';
export { AnalyticsRepositoryProvider } from './presentation/analyticsServices';
export { dashboardPaths } from './presentation/dashboardPaths';
export { DashboardPage } from './presentation/pages/DashboardPage';
