export interface BreakdownItem {
  value: string;
  count: number;
  /** Share of the filtered total, between 0 and 1. */
  share: number;
}

export interface Kpis {
  total: number;
  open: number;
  closed: number;
  /** closed / total, between 0 and 1. */
  resolutionRate: number;
}
