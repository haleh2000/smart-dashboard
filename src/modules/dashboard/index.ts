// Public API of the dashboard module. Other code imports from "@/modules/dashboard" only.
export type { AnalyticsRepository } from './domain/AnalyticsRepository';
export { MockAnalyticsRepository } from './infrastructure/MockAnalyticsRepository';
export { AnalyticsRepositoryProvider } from './presentation/analyticsServices';
export { DashboardPage } from './presentation/pages/DashboardPage';
