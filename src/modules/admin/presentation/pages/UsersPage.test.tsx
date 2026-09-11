import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { UserRepository } from '../../domain/AdminRepositories';
import type { StaffUser } from '../../domain/staffUser';
import { UserRepositoryProvider } from '../adminServices';
import { UsersPage } from './UsersPage';

const user: StaffUser = {
  id: 'u-1',
  fullName: 'سارا احمدی',
  mobile: '09121234567',
  role: 'agent',
  team: 'خسارت',
  active: true,
  createdAt: new Date('2026-01-01T10:00:00Z'),
};

const fakeRepository = (): UserRepository => ({
  list: vi.fn(async (query) => ({
    items: [user],
    total: 1,
    page: query.page,
    pageSize: query.pageSize,
  })),
  create: vi.fn(async (input) => ({ ...user, ...input, id: 'u-2' })),
  update: vi.fn(async (_id, input) => ({ ...user, ...input })),
  setActive: vi.fn(async (_id, active) => ({ ...user, active })),
  countByRole: vi.fn(async () => ({ agent: 1, supervisor: 0, admin: 0 })),
});

const renderPage = (repository: UserRepository) =>
  renderWithProviders({
    initialPath: '/admin/users',
    routes: [{ path: '/admin/users', element: <UsersPage /> }],
    wrapper: (children) => (
      <UserRepositoryProvider value={repository}>{children}</UserRepositoryProvider>
    ),
  });

describe('UsersPage', () => {
  it('lists users with Persian digits and a role badge', async () => {
    renderPage(fakeRepository());

    const table = await screen.findByRole('table');
    expect(within(table).getByText('سارا احمدی')).toBeInTheDocument();
    expect(within(table).getByText('۰۹۱۲۱۲۳۴۵۶۷')).toBeInTheDocument();
    expect(within(table).getByText('اپراتور')).toBeInTheDocument();
  });

  it('validates the mobile before creating a user', async () => {
    const repository = fakeRepository();
    renderPage(repository);
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('button', { name: 'کاربر جدید' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('نام و نام خانوادگی'), 'رضا رضایی');
    await userEvent.type(within(dialog).getByLabelText('موبایل'), '0912');
    await userEvent.type(within(dialog).getByLabelText('تیم / صف'), 'درمان');
    await userEvent.click(within(dialog).getByRole('button', { name: 'ذخیره' }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent('شماره موبایل');
    expect(repository.create).not.toHaveBeenCalled();

    await userEvent.clear(within(dialog).getByLabelText('موبایل'));
    await userEvent.type(within(dialog).getByLabelText('موبایل'), '۰۹۳۵۱۲۳۴۵۶۷');
    await userEvent.click(within(dialog).getByRole('button', { name: 'ذخیره' }));

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'رضا رضایی', mobile: '09351234567', team: 'درمان' }),
    );
  });
});
