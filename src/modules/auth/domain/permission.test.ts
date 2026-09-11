import { hasPermission } from './permission';

describe('hasPermission', () => {
  it('hides analytics from agents', () => {
    expect(hasPermission('agent', 'dashboard.view')).toBe(false);
    expect(hasPermission('agent', 'tickets.view')).toBe(true);
  });

  it('lets agents and supervisors take incoming calls', () => {
    expect(hasPermission('agent', 'calls.receive')).toBe(true);
    expect(hasPermission('supervisor', 'calls.receive')).toBe(true);
  });

  it('restricts system management to admins', () => {
    expect(hasPermission('supervisor', 'admin.manage')).toBe(false);
    expect(hasPermission('admin', 'admin.manage')).toBe(true);
  });
});
