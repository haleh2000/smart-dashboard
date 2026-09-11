import type { Permission } from '@/modules/auth';
import { ticketPaths } from '@/modules/tickets';
import type { NavIconName } from '@/shared/ui';

export interface NavItem {
  label: string;
  /** Used by the mobile bottom bar, where space is tight. */
  shortLabel: string;
  path: string;
  permission: Permission;
  icon: NavIconName;
}

/**
 * Sidebar structure from README → «ساختار Sidebar و صفحات», flattened like the Daydar rail.
 * Items are hidden when the role lacks the permission; the first visible item is the landing page.
 */
export const navigation: NavItem[] = [
  {
    label: 'داشبورد',
    shortLabel: 'داشبورد',
    path: '/dashboard',
    permission: 'dashboard.view',
    icon: 'dashboard',
  },
  {
    label: 'تیکت‌ها',
    shortLabel: 'تیکت‌ها',
    path: ticketPaths.list,
    permission: 'tickets.view',
    icon: 'tickets',
  },
  {
    label: 'تماس‌ها',
    shortLabel: 'تماس‌ها',
    path: '/calls',
    permission: 'calls.view',
    icon: 'calls',
  },
  {
    label: 'مشتریان',
    shortLabel: 'مشتریان',
    path: '/customers',
    permission: 'customers.view',
    icon: 'customers',
  },
  {
    label: 'مدیریت کاربران',
    shortLabel: 'کاربران',
    path: '/admin/users',
    permission: 'admin.manage',
    icon: 'users',
  },
  {
    label: 'دسترسی‌ها',
    shortLabel: 'دسترسی',
    path: '/admin/roles',
    permission: 'admin.manage',
    icon: 'roles',
  },
  {
    label: 'تنظیمات',
    shortLabel: 'تنظیمات',
    path: '/admin/settings',
    permission: 'admin.manage',
    icon: 'settings',
  },
];

/** The single entry owning the current route: the longest nav path the location falls under. */
export const activeNavPath = (items: NavItem[], pathname: string) =>
  items
    .map((item) => item.path)
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];
