import { useMemo, type ReactNode } from 'react';
import { PRIORITIES, SENTIMENTS } from '@/shared/domain/insights';
import { priorityMeta, sentimentMeta } from '@/shared/ui';
import { TICKET_STATUS_FILTERS } from '../../domain/ticket';
import { useTicketFilterOptions } from '../hooks/ticketQueries';
import type { TicketListState } from '../hooks/ticketListParams';
import type { TicketListChanges } from '../hooks/useTicketListParams';
import { statusFilterLabel } from '../ticketLabels';

interface TicketColumnFiltersProps {
  state: TicketListState;
  onChange: (changes: TicketListChanges) => void;
}

const asOptions = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value }));

const distinct = (values: readonly string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, 'fa'));

/**
 * The only filters of the ticket list, each one a dropdown on the header of the column it
 * filters: وضعیت، احساس، اولویت and the two levels of the subject. Nothing else filters here.
 */
export function useTicketColumnFilters({
  state,
  onChange,
}: TicketColumnFiltersProps): Record<string, ReactNode> {
  const { data: options } = useTicketFilterOptions();

  const subject1Options = useMemo(
    () => distinct(options?.subjectPaths.map((path) => path.level1) ?? []),
    [options],
  );
  // A level offers the children of the level above it; before that level is picked it
  // offers the whole level, so the dropdown is never an empty list.
  const subject2Options = useMemo(
    () =>
      distinct(
        (options?.subjectPaths ?? [])
          .filter((path) => !state.subject1 || path.level1 === state.subject1)
          .map((path) => path.level2),
      ),
    [options, state.subject1],
  );
  const subject3Options = useMemo(
    () =>
      distinct(
        (options?.subjectPaths ?? [])
          .filter(
            (path) =>
              (!state.subject1 || path.level1 === state.subject1) &&
              (!state.subject2 || path.level2 === state.subject2),
          )
          .map((path) => path.level3),
      ),
    [options, state.subject1, state.subject2],
  );

  const filter = (
    label: string,
    value: string | undefined,
    choices: readonly { value: string; label: string }[],
    onSelect: (value: string | undefined) => void,
  ) => (
    <select
      className="form-select"
      aria-label={label}
      // «همه» alone would be ambiguous in a row of selects, so the tooltip names the column.
      title={`فیلتر ${label}`}
      value={value ?? ''}
      onChange={(event) => onSelect(event.target.value || undefined)}
      onClick={(event) => event.stopPropagation()}
    >
      <option value="">همه</option>
      {choices.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  );

  return {
    status: filter(
      'وضعیت',
      state.status,
      TICKET_STATUS_FILTERS.map((value) => ({ value, label: statusFilterLabel(value) })),
      (status) => onChange({ status: status as TicketListState['status'] }),
    ),
    sentiment: filter(
      'احساس',
      state.sentiment,
      SENTIMENTS.map((value) => ({ value, label: sentimentMeta[value].label })),
      (sentiment) => onChange({ sentiment: sentiment as TicketListState['sentiment'] }),
    ),
    priority: filter(
      'اولویت',
      state.priority,
      PRIORITIES.map((value) => ({ value, label: priorityMeta[value].label })),
      (priority) => onChange({ priority: priority as TicketListState['priority'] }),
    ),
    type: filter('نوع تیکت', state.type, asOptions(options?.types ?? []), (type) =>
      type === 'شکایت'
        ? onChange({ type, subject1: undefined, subject2: undefined, subject3: undefined })
        : onChange({ type }),
    ),
    // The subject levels are one path: changing a level clears the ones below it.
    subject1: filter('نوع اصلی شکایت', state.subject1, asOptions(subject1Options), (subject1) =>
      onChange({ subject1, subject2: undefined, subject3: undefined }),
    ),
    subject2: filter('نوع شکایت', state.subject2, asOptions(subject2Options), (subject2) =>
      onChange({ subject2, subject3: undefined }),
    ),
    subject3: filter('علت شکایت', state.subject3, asOptions(subject3Options), (subject3) =>
      onChange({ subject3 }),
    ),
  };
}