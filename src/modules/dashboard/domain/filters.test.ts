import {
  filtersForChart,
  persianWeekday,
  removeFilter,
  selectSubject,
  subjectDrillLevel,
  toggleFilter,
} from './filters';

describe('dashboard filters', () => {
  it('toggles a value on and off', () => {
    const on = toggleFilter({}, 'channel', 'تلفن');
    expect(on).toEqual({ channel: 'تلفن' });
    expect(toggleFilter(on, 'channel', 'تلفن')).toEqual({});
  });

  it('replaces the value of the same dimension', () => {
    expect(toggleFilter({ channel: 'تلفن' }, 'channel', 'وب')).toEqual({ channel: 'وب' });
  });

  it('clears deeper subject levels when a parent level changes or is removed', () => {
    const path = { subject1: 'الف', subject2: 'ب', subject3: 'ج', branch: 'تهران' };

    expect(removeFilter(path, 'subject2')).toEqual({ subject1: 'الف', branch: 'تهران' });
    expect(toggleFilter(path, 'subject1', 'د')).toEqual({ subject1: 'د', branch: 'تهران' });
  });

  it('drills down subject levels', () => {
    expect(subjectDrillLevel({})).toBe('subject1');
    expect(subjectDrillLevel({ subject1: 'الف' })).toBe('subject2');
    expect(subjectDrillLevel({ subject1: 'الف', subject2: 'ب' })).toBe('subject3');
  });

  it('excludes the chart’s own dimensions', () => {
    expect(filtersForChart({ channel: 'وب', branch: 'قم' }, 'channel')).toEqual({ branch: 'قم' });
    expect(
      filtersForChart({ channel: 'وب', type: 'شکایت', branch: 'قم' }, 'channel', 'type'),
    ).toEqual({ branch: 'قم' });
  });
});

describe('selectSubject (hierarchical subject table)', () => {
  it('selects a whole path and keeps unrelated filters', () => {
    expect(selectSubject({ branch: 'قم' }, ['الف', 'ب'])).toEqual({
      branch: 'قم',
      subject1: 'الف',
      subject2: 'ب',
    });
  });

  it('clicking the selected node goes back up one level', () => {
    const selected = { subject1: 'الف', subject2: 'ب', subject3: 'ج' };

    expect(selectSubject(selected, ['الف', 'ب', 'ج'])).toEqual({ subject1: 'الف', subject2: 'ب' });
    expect(selectSubject({ subject1: 'الف' }, ['الف'])).toEqual({});
  });

  it('selecting a parent of the current selection narrows back to that parent', () => {
    expect(selectSubject({ subject1: 'الف', subject2: 'ب' }, ['الف'])).toEqual({ subject1: 'الف' });
  });
});

describe('persianWeekday', () => {
  it('starts the week on Saturday', () => {
    expect(persianWeekday(new Date(2026, 8, 12))).toBe(0); // Saturday
    expect(persianWeekday(new Date(2026, 8, 11))).toBe(6); // Friday
  });
});
