export type SortDirection = 'asc' | 'desc';

export interface Sort<TField extends string> {
  field: TField;
  direction: SortDirection;
}

export interface PageRequest {
  /** 1-based page number. */
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const pageCount = ({ total, pageSize }: Pick<Page<unknown>, 'total' | 'pageSize'>) =>
  Math.max(1, Math.ceil(total / pageSize));
