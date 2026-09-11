import { hasErrors, validateStaffUser, type StaffUserInput } from './staffUser';

const valid: StaffUserInput = {
  fullName: 'سارا احمدی',
  mobile: '09121234567',
  role: 'agent',
  team: 'خسارت',
};

describe('validateStaffUser', () => {
  it('accepts a complete form', () => {
    expect(hasErrors(validateStaffUser(valid))).toBe(false);
  });

  it('reports each invalid field', () => {
    expect(
      validateStaffUser({ ...valid, fullName: ' ', mobile: '0912', email: 'x@', team: '' }),
    ).toEqual({
      fullName: 'required',
      mobile: 'invalidMobile',
      email: 'invalidEmail',
      team: 'required',
    });
  });
});
