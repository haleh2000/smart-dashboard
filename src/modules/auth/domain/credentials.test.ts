import { isValidMobile } from './credentials';

describe('isValidMobile', () => {
  it.each([
    ['09121234567', true],
    ['9121234567', false],
    ['0912123456', false],
    ['0812123456a', false],
  ])('%s → %s', (mobile, expected) => {
    expect(isValidMobile(mobile)).toBe(expected);
  });
});
