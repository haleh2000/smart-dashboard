/**
 * Cross-filtering rules (README → «الزام تعاملی برای SMART»):
 * clicking any chart segment filters the whole dashboard; clicking it again removes the filter.
 */
export const DIMENSIONS = [
  'subject1',
  'subject2',
  'subject3',
  'type',
  'channel',
  'insuranceLine',
  'branch',
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

/** At most one selected value per dimension. */
export type DashboardFilters = Partial<Record<Dimension, string>>;

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

/** Subject drill-down: Subject1 → Subject2 → Subject3. */
export const subjectDrillLevel = (filters: DashboardFilters): Dimension =>
  filters.subject2 ? 'subject3' : filters.subject1 ? 'subject2' : 'subject1';

/**
 * Filters a chart should query with: everything except its own dimension,
 * so the chart keeps showing all its segments and highlights the selected one.
 */
export const filtersForChart = (filters: DashboardFilters, dimension: Dimension) =>
  omit(filters, [dimension]);
