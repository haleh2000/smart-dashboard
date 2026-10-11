import { adminPaths } from '@/modules/admin';
import type { Permission } from '@/modules/auth';
import { callPaths } from '@/modules/calls';
import { customerPaths } from '@/modules/customers';
import { ticketPaths } from '@/modules/tickets';
import type { NavIconName } from '@/shared/ui';

export interface NavItem {
  label: string;
  shortLabel: string;
  path: string;
  permission: Permission;
  icon: NavIconName;
  group?: string;
}


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
    path: callPaths.list,
    permission: 'calls.view',
    icon: 'calls',
  },
  {
    label: 'مشتریان',
    shortLabel: 'مشتریان',
    path: customerPaths.list,
    permission: 'customers.view',
    icon: 'customers',
  },
  {
    label: 'کاربران',
    shortLabel: 'مدیریت',
    path: adminPaths.users,
    permission: 'admin.manage',
    icon: 'users',
    group: 'مدیریت',
  },
  {
    label: 'دسترسی‌ها',
    shortLabel: 'دسترسی',
    path: adminPaths.roles,
    permission: 'admin.manage',
    icon: 'roles',
    group: 'مدیریت',
  },
  {
    label: 'تنظیمات',
    shortLabel: 'تنظیمات',
    path: adminPaths.settings,
    permission: 'admin.manage',
    icon: 'settings', 
    group: 'مدیریت',
  },
];

export const activeNavPath = (items: NavItem[], pathname: string) =>
  items
    .map((item) => item.path)
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];


export const bottomNavItems = (items: NavItem[]) => {
  const entries: (NavItem & { paths: string[] })[] = [];
  for (const item of items) {
    const existing = item.group && entries.find((entry) => entry.group === item.group);
    if (existing) existing.paths.push(item.path);
    else entries.push({ ...item, paths: [item.path] });
  }
  return entries;
};
