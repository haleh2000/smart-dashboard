import type { BadgeTone } from '@/shared/ui';
import type {
  ClaimStatus,
  CustomerKind,
  CustomerStatus,
  InteractionKind,
  PolicyStatus,
} from '../domain/customer';

interface Meta {
  label: string;
  tone: BadgeTone;
}

export const customerStatusMeta: Record<CustomerStatus, Meta> = {
  active: { label: 'فعال', tone: 'success' },
  inactive: { label: 'غیرفعال', tone: 'neutral' },
  suspended: { label: 'تعلیق‌شده', tone: 'error' },
};

export const customerKindLabels: Record<CustomerKind, string> = {
  individual: 'فردی',
  corporate: 'سازمانی',
};

export const policyStatusMeta: Record<PolicyStatus, Meta> = {
  active: { label: 'فعال', tone: 'success' },
  expired: { label: 'منقضی', tone: 'neutral' },
  cancelled: { label: 'ابطال‌شده', tone: 'error' },
};

export const claimStatusMeta: Record<ClaimStatus, Meta> = {
  filed: { label: 'ثبت‌شده', tone: 'info' },
  underReview: { label: 'در حال بررسی', tone: 'warning' },
  approved: { label: 'تأیید‌شده', tone: 'success' },
  paid: { label: 'پرداخت‌شده', tone: 'success' },
  rejected: { label: 'رد‌شده', tone: 'error' },
};

export const interactionKindMeta: Record<InteractionKind, Meta> = {
  call: { label: 'تماس', tone: 'info' },
  ticket: { label: 'تیکت', tone: 'neutral' },
  complaint: { label: 'شکایت', tone: 'warning' },
};

export const genderLabels = { male: 'مرد', female: 'زن' } as const;
