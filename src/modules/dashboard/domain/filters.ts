import type { DateRange } from '@/shared/domain/period';

export const DIMENSIONS = [
  'subject1',
  'subject2',
  'subject3',
  'type',
  'detailStatus',
  'corporate',
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

export type DashboardFilters = Partial<Record<Dimension, string>>;

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

export const subjectDrillLevel = (filters: DashboardFilters): Dimension =>
  filters.subject2 ? 'subject3' : filters.subject1 ? 'subject2' : 'subject1';


export const filtersForChart = (
  filters: DashboardFilters,
  ...dimensions: readonly Dimension[]
): DashboardFilters => omit(filters, dimensions);

export const scopeForChart = (
  scope: DashboardScope,
  ...dimensions: readonly Dimension[]
): DashboardScope => ({ ...scope, filters: filtersForChart(scope.filters, ...dimensions) });

export const SUBJECT_DIMENSIONS = SUBJECT_LEVELS;

export const persianWeekday = (date: Date) => (date.getDay() + 1) % 7;
