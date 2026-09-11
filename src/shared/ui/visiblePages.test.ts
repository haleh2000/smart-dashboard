import { visiblePages } from './visiblePages';

describe('visiblePages', () => {
  it('shows every page when there are few', () => {
    expect(visiblePages(2, 3)).toEqual([1, 2, 3]);
  });

  it('collapses distant pages into gaps', () => {
    expect(visiblePages(10, 24)).toEqual([1, null, 9, 10, 11, null, 24]);
  });
});
