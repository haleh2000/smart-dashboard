import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { adminPaths, RolesPage, SettingsPage, UsersPage } from '@/modules/admin';
import {
  authPaths,
  LoginPage,
  RequirePermission,
  SessionGate,
  type Permission,
} from '@/modules/auth';
import { CallDetailPage, CallListPage } from '@/modules/calls';
import { CustomerListPage, CustomerProfilePage } from '@/modules/customers';
import { DashboardPage } from '@/modules/dashboard';
import { TicketDetailPage, TicketListPage } from '@/modules/tickets';
import { AppShell } from './layout/AppShell';
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
      { path: 'calls', element: guarded('calls.view', <CallListPage />) },
      { path: 'calls/:callId', element: guarded('calls.view', <CallDetailPage />) },
      { path: 'customers', element: guarded('customers.view', <CustomerListPage />) },
      {
        path: 'customers/:nationalId',
        element: guarded('customers.view', <CustomerProfilePage />),
      },
      { path: 'admin', element: <Navigate to={adminPaths.users} replace /> },
      { path: 'admin/users', element: guarded('admin.manage', <UsersPage />) },
      { path: 'admin/roles', element: guarded('admin.manage', <RolesPage />) },
      { path: 'admin/settings', element: guarded('admin.manage', <SettingsPage />) },
      { path: '*', element: <RouteErrorPage /> },
    ],
  },
]);
