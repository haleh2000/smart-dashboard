import type { DateRange } from '@/shared/domain/period';

/**
 * Cross-filtering rules (README → «الزام تعاملی برای SMART»):
 * clicking any chart segment filters the whole dashboard; clicking it again removes the filter.
 * Every dimension applies to both tickets and calls, so all three dashboard tabs stay in sync.
 */
export const DIMENSIONS = [
  'subject1',
  'subject2',
  'subject3',
  'type',
  'channel',
  'insuranceLine',
  'branch',
  'sentiment',
  'sentimentLevel',
  'operator',
  'weekday',
  'hour',
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

/** At most one selected value per dimension. */
export type DashboardFilters = Partial<Record<Dimension, string>>;

/** What every analytics query is scoped by: the cross-filters plus the time filter. */
export interface DashboardScope {
  filters: DashboardFilters;
  range?: DateRange;
}

const SUBJECT_LEVELS = ['subject1', 'subject2', 'subject3'] as const satisfies readonly Dimension[];

const isSubjectLevel = (d: Dimension): d is (typeof SUBJECT_LEVELS)[number] =>
  (SUBJECT_LEVELS as readonly Dimension[]).includes(d);

const omit = (filters: DashboardFilters, dimensions: readonly Dimension[]): DashboardFilters =>
  Object.fromEntries(
    Object.entries(filters).filter(([key]) => !dimensions.includes(key as Dimension)),
  );

/** Removes a filter. Removing a subject level also removes the deeper levels of the drill-down path. */
export const removeFilter = (filters: DashboardFilters, dimension: Dimension): DashboardFilters =>
  omit(
    filters,
    isSubjectLevel(dimension)
      ? SUBJECT_LEVELS.slice(SUBJECT_LEVELS.indexOf(dimension))
      : [dimension],
  );

export const toggleFilter = (
  filters: DashboardFilters,
  dimension: Dimension,
  value: string,
): DashboardFilters =>
  filters[dimension] === value
    ? removeFilter(filters, dimension)
    : { ...removeFilter(filters, dimension), [dimension]: value };

/**
 * Selects a whole subject path at once (hierarchical subject table): the parents are set and
 * everything deeper than the clicked level is cleared. Clicking the selected node again deselects it.
 */
export const selectSubject = (
  filters: DashboardFilters,
  path: readonly string[],
): DashboardFilters => {
  const alreadySelected =
    path.every((value, i) => filters[SUBJECT_LEVELS[i]!] === value) &&
    !filters[SUBJECT_LEVELS[path.length]!];
  const selected = alreadySelected ? path.slice(0, -1) : path;
  return {
    ...removeFilter(filters, 'subject1'),
    ...Object.fromEntries(selected.slice(0, 3).map((value, i) => [SUBJECT_LEVELS[i]!, value])),
  };
};

/** Subject drill-down: Subject1 → Subject2 → Subject3. */
export const subjectDrillLevel = (filters: DashboardFilters): Dimension =>
  filters.subject2 ? 'subject3' : filters.subject1 ? 'subject2' : 'subject1';

/**
 * Filters a chart should query with: everything except its own dimensions,
 * so the chart keeps showing all its segments and highlights the selected one.
 */
export const filtersForChart = (
  filters: DashboardFilters,
  ...dimensions: readonly Dimension[]
): DashboardFilters => omit(filters, dimensions);

/** Scope for a chart that plots the given dimensions. */
export const scopeForChart = (
  scope: DashboardScope,
  ...dimensions: readonly Dimension[]
): DashboardScope => ({ ...scope, filters: filtersForChart(scope.filters, ...dimensions) });

/** Subject levels are excluded together by the subject table, which shows the whole tree. */
export const SUBJECT_DIMENSIONS = SUBJECT_LEVELS;

/** Persian week: Saturday = 0 … Friday = 6. */
export const persianWeekday = (date: Date) => (date.getDay() + 1) % 7;
