import { isLockedPermission, togglePermission, validateRole } from './roleDefinition';

const existing = [
  { id: 'agent', name: 'اپراتور' },
  { id: 'qa', name: 'Quality Team' },
];

describe('validateRole', () => {
  it('requires a name and at least one permission', () => {
    expect(validateRole({ name: '  ', description: '', permissions: [] }, existing)).toEqual({
      name: 'required',
      permissions: 'noPermission',
    });
  });

  it('rejects names longer than 40 characters', () => {
    const name = 'ن'.repeat(41);
    expect(
      validateRole({ name, description: '', permissions: ['tickets.view'] }, existing),
    ).toEqual({ name: 'tooLong' });
  });

  it('rejects a duplicate name regardless of case, except for the role being edited', () => {
    const input = { name: ' quality team ', description: '', permissions: ['calls.view' as const] };
    expect(validateRole(input, existing)).toEqual({ name: 'duplicate' });
    expect(validateRole(input, existing, 'qa')).toEqual({});
  });
});

describe('togglePermission', () => {
  const admin = {
    system: true,
    baseRole: 'admin' as const,
    permissions: ['admin.manage' as const],
  };

  it('keeps admin.manage on the admin role', () => {
    expect(isLockedPermission(admin, 'admin.manage')).toBe(true);
    expect(togglePermission(admin, 'admin.manage')).toEqual(['admin.manage']);
  });

  it('adds and removes other permissions', () => {
    const custom = { system: false, permissions: ['tickets.view' as const] };
    expect(togglePermission(custom, 'calls.view')).toEqual(['tickets.view', 'calls.view']);
    expect(togglePermission(custom, 'tickets.view')).toEqual([]);
  });
});
