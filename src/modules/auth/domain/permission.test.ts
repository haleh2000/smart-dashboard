import { hasPermission } from './permission';

describe('hasPermission', () => {
  it('hides analytics from agents', () => {
    expect(hasPermission('agent', 'dashboard.view')).toBe(false);
    expect(hasPermission('agent', 'tickets.view')).toBe(true);
  });

  it('restricts system management to admins', () => {
    expect(hasPermission('supervisor', 'admin.manage')).toBe(false);
    expect(hasPermission('admin', 'admin.manage')).toBe(true);
  });
});
