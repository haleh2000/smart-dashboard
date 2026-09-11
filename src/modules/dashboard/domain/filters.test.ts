import { filtersForChart, removeFilter, subjectDrillLevel, toggleFilter } from './filters';

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

  it('excludes the chart’s own dimension', () => {
    expect(filtersForChart({ channel: 'وب', branch: 'قم' }, 'channel')).toEqual({ branch: 'قم' });
  });
});
