import { isCategorized, isCompleteSubject } from './call';

describe('call categorization', () => {
  it('requires all three levels', () => {
    expect(isCompleteSubject({ level1: 'الف', level2: 'ب' })).toBe(false);
    expect(isCompleteSubject({ level1: 'الف', level2: 'ب', level3: '' })).toBe(false);
    expect(isCompleteSubject({ level1: 'الف', level2: 'ب', level3: 'ج' })).toBe(true);
  });

  it('treats a call without a subject as uncategorized', () => {
    expect(isCategorized({})).toBe(false);
    expect(isCategorized({ subject: { level1: 'الف', level2: 'ب', level3: 'ج' } })).toBe(true);
  });
});
