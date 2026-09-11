import { useState } from 'react';
import { ROLES, roleLabels, type Role } from '@/modules/auth';
import { pageCount } from '@/shared/domain/pagination';
import { downloadCsv } from '@/shared/lib/csv';
import { formatDateTime, formatPersianNumber, toLatinDigits } from '@/shared/lib/format';
import {
  ActionMenu,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterField,
  FilterSelect,
  PageHeader,
  Pagination,
  SkeletonTable,
  StatusBadge,
  tableExport,
  type DataColumn,
} from '@/shared/ui';
import type { StaffUser } from '../../domain/staffUser';
import { activeMeta, roleTones } from '../adminLabels';
import { useUserRepository } from '../adminServices';
import { UserFormDialog } from '../components/UserFormDialog';
import { useSetUserActive, useUsers } from '../hooks/adminQueries';
import { useUserListParams } from '../hooks/useUserListParams';

type DialogState = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; user: StaffUser };

const statusOptions = [
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
] as const;

export function UsersPage() {
  const { query, update } = useUserListParams();
  const { data, isPending, isError, refetch } = useUsers(query);
  const repository = useUserRepository();
  const setActive = useSetUserActive();
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });
  const [draft, setDraft] = useState(query.search ?? '');
  const [exporting, setExporting] = useState(false);

  const columns: DataColumn<StaffUser>[] = [
    { header: 'نام', cell: (u) => u.fullName, exportValue: (u) => u.fullName },
    {
      header: 'موبایل',
      cell: (u) => formatPersianNumber(u.mobile),
      exportValue: (u) => u.mobile,
    },
    {
      header: 'ایمیل',
      cell: (u) =>
        u.email ? <bdi dir="ltr">{u.email}</bdi> : <span className="queue-table__muted">—</span>,
      exportValue: (u) => u.email,
    },
    {
      header: 'نقش',
      cell: (u) => <StatusBadge tone={roleTones[u.role]}>{roleLabels[u.role]}</StatusBadge>,
      exportValue: (u) => roleLabels[u.role],
    },
    { header: 'تیم', cell: (u) => u.team, exportValue: (u) => u.team },
    {
      header: 'وضعیت',
      cell: (u) => {
        const meta = u.active ? activeMeta.active : activeMeta.inactive;
        return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
      },
      exportValue: (u) => (u.active ? activeMeta.active.label : activeMeta.inactive.label),
    },
    {
      header: 'آخرین ورود',
      cell: (u) =>
        u.lastLoginAt ? (
          formatDateTime(u.lastLoginAt)
        ) : (
          <span className="queue-table__muted">—</span>
        ),
      exportValue: (u) => (u.lastLoginAt ? formatDateTime(u.lastLoginAt) : ''),
    },
    {
      header: 'تاریخ ایجاد',
      cell: (u) => formatDateTime(u.createdAt),
      exportValue: (u) => formatDateTime(u.createdAt),
    },
    {
      header: 'عملیات',
      interactive: true,
      cell: (u) => (
        <ActionMenu
          label={`عملیات ${u.fullName}`}
          items={[
            { label: 'ویرایش', onSelect: () => setDialog({ kind: 'edit', user: u }) },
            {
              label: u.active ? 'غیرفعال‌سازی' : 'فعال‌سازی',
              danger: u.active,
              onSelect: () => setActive.mutate({ id: u.id, active: !u.active }),
            },
          ]}
        />
      ),
    },
  ];

  const exportUsers = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const all = await repository.list({ ...query, page: 1, pageSize: Math.max(data.total, 1) });
      const file = tableExport(columns, all.items);
      downloadCsv('smart-users', file.headers, file.rows);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="مدیریت کاربران"
        subtitle="کاربران SMART، نقش و تیم هر کاربر"
        actions={<Button onClick={() => setDialog({ kind: 'create' })}>کاربر جدید</Button>}
      />

      <FilterBar
        onSubmit={() => update({ search: toLatinDigits(draft.trim()) || undefined })}
        meta={
          <>
            {data && (
              <span className="filter-bar__count">{formatPersianNumber(data.total)} کاربر</span>
            )}
            <Button variant="ghost" onClick={exportUsers} disabled={!data || exporting}>
              خروجی Excel
            </Button>
          </>
        }
      >
        <FilterField label="جستجو" wide>
          <span className="filter-bar__search">
            <input
              type="search"
              className="form-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="نام، موبایل یا ایمیل"
            />
            <Button type="submit">جستجو</Button>
          </span>
        </FilterField>
        <FilterSelect<Role>
          label="نقش"
          value={query.role}
          allLabel="همه نقش‌ها"
          options={ROLES.map((role) => ({ value: role, label: roleLabels[role] }))}
          onChange={(role) => update({ role })}
        />
        <FilterSelect<'active' | 'inactive'>
          label="وضعیت"
          value={query.active === undefined ? undefined : query.active ? 'active' : 'inactive'}
          allLabel="همه"
          options={statusOptions}
          onChange={(status) =>
            update({ active: status === undefined ? undefined : status === 'active' })
          }
        />
      </FilterBar>

      {isPending ? (
        <SkeletonTable rows={8} />
      ) : isError ? (
        <ErrorState message="دریافت کاربران با خطا مواجه شد." onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState message="کاربری با این فیلترها پیدا نشد." />
      ) : (
        <>
          <DataTable rows={data.items} columns={columns} rowKey={(u) => u.id} />
          <Pagination
            page={data.page}
            pageCount={pageCount(data)}
            pageSize={data.pageSize}
            total={data.total}
            onChange={(page) => update({ page })}
          />
        </>
      )}

      {dialog.kind !== 'closed' && (
        <UserFormDialog
          key={dialog.kind === 'edit' ? dialog.user.id : 'new'}
          open
          user={dialog.kind === 'edit' ? dialog.user : undefined}
          onClose={() => setDialog({ kind: 'closed' })}
        />
      )}
    </section>
  );
}
