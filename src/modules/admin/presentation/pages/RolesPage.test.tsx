import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { permissionsOf, ROLES, roleLabels } from '@/modules/auth';
import type { RoleRepository, UserRepository } from '../../domain/AdminRepositories';
import type { RoleDefinition, RoleInput } from '../../domain/roleDefinition';
import { RoleRepositoryProvider, UserRepositoryProvider } from '../adminServices';
import { RolesPage } from './RolesPage';

/** In-memory fake: the three built-in roles seeded from the RBAC matrix. */
class FakeRoleRepository implements RoleRepository {
  roles: RoleDefinition[] = ROLES.map((role) => ({
    id: role,
    name: roleLabels[role],
    description: '',
    permissions: [...permissionsOf(role)],
    system: true,
    baseRole: role,
    createdAt: new Date(0),
  }));

  async list() {
    return this.roles.map((role) => ({ ...role }));
  }

  async create(input: RoleInput) {
    const role: RoleDefinition = { ...input, id: 'new', system: false, createdAt: new Date() };
    this.roles = [...this.roles, role];
    return role;
  }

  async update(id: string, input: RoleInput) {
    const current = this.roles.find((role) => role.id === id)!;
    const next = { ...current, permissions: input.permissions };
    this.roles = this.roles.map((role) => (role.id === id ? next : role));
    return next;
  }

  async remove(id: string) {
    this.roles = this.roles.filter((role) => role.id !== id);
  }
}

const users: UserRepository = {
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setActive: vi.fn(),
  countByRole: vi.fn(async () => ({ agent: 8, supervisor: 2, admin: 1 })),
};

const renderPage = (roles: RoleRepository) =>
  renderWithProviders({
    initialPath: '/admin/roles',
    routes: [{ path: '/admin/roles', element: <RolesPage /> }],
    wrapper: (children: ReactNode) => (
      <UserRepositoryProvider value={users}>
        <RoleRepositoryProvider value={roles}>{children}</RoleRepositoryProvider>
      </UserRepositoryProvider>
    ),
  });

describe('RolesPage', () => {
  it('renders the permission matrix and locks admin management on the admin role', async () => {
    renderPage(new FakeRoleRepository());

    const dashboardRow = (
      await screen.findByRole('rowheader', { name: 'داشبورد، Analytics و گزارش‌ها' })
    ).closest('tr')!;
    const [agent, supervisor, admin] = within(dashboardRow).getAllByRole('checkbox');
    expect(agent).not.toBeChecked();
    expect(supervisor).toBeChecked();
    expect(admin).toBeChecked();

    expect(
      screen.getByRole('checkbox', { name: 'مدیریت کاربران، دسترسی‌ها و تنظیمات سیستم — مدیر' }),
    ).toBeDisabled();
    expect(await screen.findByText('۸ کاربر فعال')).toBeInTheDocument();
  });

  it('saves a matrix toggle through the repository', async () => {
    const repository = new FakeRoleRepository();
    const update = vi.spyOn(repository, 'update');
    renderPage(repository);

    await userEvent.click(
      await screen.findByRole('checkbox', { name: 'داشبورد، Analytics و گزارش‌ها — اپراتور' }),
    );

    expect(update).toHaveBeenCalledWith(
      'agent',
      expect.objectContaining({ permissions: expect.arrayContaining(['dashboard.view']) }),
    );
    expect(await screen.findByText('ذخیره شد')).toBeInTheDocument();
  });

  it('creates a custom role from the dialog and validates the name', async () => {
    const repository = new FakeRoleRepository();
    renderPage(repository);

    await userEvent.click(await screen.findByRole('button', { name: 'نقش جدید' }));
    const dialog = await screen.findByRole('dialog', { name: 'نقش جدید' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'ذخیره' }));
    expect(within(dialog).getByText('نام نقش الزامی است.')).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText(/نام نقش/), 'پشتیبان شبانه');
    await userEvent.selectOptions(within(dialog).getByRole('combobox'), 'agent');
    await userEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

    expect(await screen.findByRole('columnheader', { name: 'پشتیبان شبانه' })).toBeInTheDocument();
  });
});
