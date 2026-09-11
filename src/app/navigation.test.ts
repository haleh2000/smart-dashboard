import { activeNavPath, bottomNavItems, navigation } from './navigation';

describe('navigation', () => {
  it('lists every README section, with the admin pages grouped under «مدیریت»', () => {
    expect(navigation.map((item) => item.label)).toEqual([
      'داشبورد',
      'تیکت‌ها',
      'تماس‌ها',
      'مشتریان',
      'کاربران',
      'دسترسی‌ها',
      'تنظیمات',
    ]);
    expect(navigation.filter((item) => item.group === 'مدیریت')).toHaveLength(3);
  });

  it('collapses a group into one bottom-bar entry that owns all its paths', () => {
    const entries = bottomNavItems(navigation);

    expect(entries).toHaveLength(5);
    expect(entries.at(-1)).toMatchObject({
      shortLabel: 'مدیریت',
      paths: ['/admin/users', '/admin/roles', '/admin/settings'],
    });
  });

  it('marks the owning entry active on nested routes', () => {
    expect(activeNavPath(navigation, '/tickets/140001')).toBe('/tickets');
    expect(activeNavPath(navigation, '/customers/0012345678')).toBe('/customers');
  });
});
