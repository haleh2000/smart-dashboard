import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import {
  authPaths,
  LoginPage,
  RequirePermission,
  SessionGate,
  type Permission,
} from '@/modules/auth';
import { DashboardPage } from '@/modules/dashboard';
import { TicketDetailPage, TicketListPage } from '@/modules/tickets';
import { AppShell } from './layout/AppShell';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomeRedirect } from './pages/HomeRedirect';
import { RouteErrorPage } from './pages/RouteErrorPage';

const guarded = (permission: Permission, element: ReactNode) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);

export const router = createBrowserRouter([
  { path: authPaths.login, element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    element: (
      <SessionGate>
        <AppShell />
      </SessionGate>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'dashboard', element: guarded('dashboard.view', <DashboardPage />) },
      { path: 'tickets', element: guarded('tickets.view', <TicketListPage />) },
      { path: 'tickets/:ticketId', element: guarded('tickets.view', <TicketDetailPage />) },
      { path: 'calls', element: guarded('calls.view', <ComingSoonPage title="تماس‌ها" />) },
      { path: 'customers', element: guarded('customers.view', <ComingSoonPage title="مشتریان" />) },
      {
        path: 'admin/users',
        element: guarded('admin.manage', <ComingSoonPage title="مدیریت کاربران" />),
      },
      {
        path: 'admin/roles',
        element: guarded('admin.manage', <ComingSoonPage title="دسترسی‌ها" />),
      },
      {
        path: 'admin/settings',
        element: guarded('admin.manage', <ComingSoonPage title="تنظیمات" />),
      },
      { path: '*', element: <RouteErrorPage /> },
    ],
  },
]);
