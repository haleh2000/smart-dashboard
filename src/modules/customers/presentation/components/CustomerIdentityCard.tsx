import { formatDate, formatPersianNumber } from '@/shared/lib/format';
import { InfoCard, InfoGrid, InfoRow } from '@/shared/ui';
import type { CustomerProfile } from '../../domain/customer';
import { customerKindLabels, genderLabels } from '../customerLabels';

/** «اطلاعات هویتی» from CRM. */
export function CustomerIdentityCard({ customer }: { customer: CustomerProfile }) {
  return (
    <InfoCard title="اطلاعات هویتی">
      <InfoGrid>
        <InfoRow label="کدملی">{formatPersianNumber(customer.nationalId)}</InfoRow>
        <InfoRow label="موبایل">{formatPersianNumber(customer.mobile)}</InfoRow>
        <InfoRow label="جنسیت">{genderLabels[customer.gender]}</InfoRow>
        <InfoRow label="تاریخ تولد">{customer.birthDate && formatDate(customer.birthDate)}</InfoRow>
        <InfoRow label="ایمیل">{customer.email && <bdi>{customer.email}</bdi>}</InfoRow>
        <InfoRow label="شهر">{customer.city}</InfoRow>
        <InfoRow label="نوع مشتری">{customerKindLabels[customer.kind]}</InfoRow>
        <InfoRow label="مشتری سازمانی">{customer.corporateName}</InfoRow>
        <InfoRow label="نماینده">
          {customer.agentName && formatPersianNumber(customer.agentName)}
        </InfoRow>
        <InfoRow label="مشتری از">{formatDate(customer.customerSince)}</InfoRow>
        <InfoRow label="آدرس" wide>
          {customer.address && formatPersianNumber(customer.address)}
        </InfoRow>
      </InfoGrid>
    </InfoCard>
  );
}
