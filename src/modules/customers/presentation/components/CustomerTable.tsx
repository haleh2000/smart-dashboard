import { useNavigate } from 'react-router';
import type { Sort } from '@/shared/domain/pagination';
import { DataTable } from '@/shared/ui';
import type { CustomerSummary } from '../../domain/customer';
import type { CustomerSortField } from '../../domain/CustomerRepository';
import { customerPaths } from '../customerPaths';
import { customerColumns } from './customerColumns';
import './CustomerTable.css';

interface CustomerTableProps {
  customers: CustomerSummary[];
  sort: Sort<CustomerSortField>;
  onSortChange: (sort: Sort<CustomerSortField>) => void;
}

export function CustomerTable({ customers, sort, onSortChange }: CustomerTableProps) {
  const navigate = useNavigate();

  return (
    <DataTable
      rows={customers}
      columns={customerColumns}
      rowKey={(c) => c.nationalId}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={(c) => navigate(customerPaths.profile(c.nationalId))}
    />
  );
}
