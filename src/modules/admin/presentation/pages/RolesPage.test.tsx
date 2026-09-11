import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { UserRepository } from '../../domain/AdminRepositories';
import { UserRepositoryProvider } from '../adminServices';
import { RolesPage } from './RolesPage';

const repository: UserRepository = {
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setActive: vi.fn(),
  countByRole: vi.fn(async () => ({ agent: 8, supervisor: 2, admin: 1 })),
};

describe('RolesPage', () => {
  it('renders the read-only permission matrix from the RBAC rules', async () => {
    renderWithProviders({
      initialPath: '/admin/roles',
      routes: [{ path: '/admin/roles', element: <RolesPage /> }],
      wrapper: (children) => (
        <UserRepositoryProvider value={repository}>{children}</UserRepositoryProvider>
      ),
    });

    const dashboardRow = screen
      .getByRole('rowheader', { name: 'داشبورد، Analytics و گزارش‌ها' })
      .closest('tr')!;
    const cells = within(dashboardRow).getAllByRole('cell');

    // agent, supervisor, admin
    expect(cells.map((cell) => cell.textContent)).toEqual(['—', '✓', '✓']);
    expect(await screen.findByText('۸ کاربر فعال')).toBeInTheDocument();
  });
});
