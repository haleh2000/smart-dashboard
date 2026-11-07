import type {
  CustomerKind,
  CustomerProfile,
  CustomerStatus,
  CustomerSummary,
} from './customer';

/** Nest `customers` row shape. */
export interface CrmCustomer {
  nationalcode: string;
  fname?: string | null;
  lname?: string | null;
  mobile?: string | null;
  accountname?: string | null;
  branchname?: string | null;
  productname?: string | null;
  kind?: string | null;
  status?: string | null;
  isvip?: boolean | null;
  gender?: string | null;
  activepolicycount?: number | null;
  openticketcount?: number | null;
  callcount?: number | null;
  lastinteractionat?: string | Date | null;
  lastsentiment?: string | null;
  customersince?: string | Date | null;
}

const blank = (value: string | null | undefined) => {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const toDate = (value: string | Date | null | undefined): Date | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const isKind = (value: string): value is CustomerKind =>
  value === 'individual' || value === 'corporate';

const isStatus = (value: string): value is CustomerStatus =>
  value === 'active' || value === 'inactive' || value === 'suspended';

const isSentiment = (value: string): value is NonNullable<CustomerSummary['lastSentiment']> =>
  value === 'positive' || value === 'neutral' || value === 'negative';

export const mapCrmCustomerToSummary = (crm: CrmCustomer): CustomerSummary => {
  const fname = blank(crm.fname);
  const lname = blank(crm.lname);
  const fullName =
    [fname, lname].filter(Boolean).join(' ').trim() ||
    blank(crm.accountname) ||
    crm.nationalcode;
  const kind = blank(crm.kind);
  const status = blank(crm.status);
  const sentiment = blank(crm.lastsentiment);

  return {
    nationalId: String(crm.nationalcode),
    fullName,
    mobile: blank(crm.mobile) ?? '',
    status: status && isStatus(status) ? status : 'active',
    kind: kind && isKind(kind) ? kind : crm.accountname ? 'corporate' : 'individual',
    corporateName: blank(crm.accountname),
    city: blank(crm.branchname) ?? '—',
    isVip: Boolean(crm.isvip),
    activePolicyCount: crm.activepolicycount ?? 0,
    openTicketCount: crm.openticketcount ?? 0,
    lastInteractionAt: toDate(crm.lastinteractionat),
    lastSentiment: sentiment && isSentiment(sentiment) ? sentiment : undefined,
  };
};

export const mapCrmCustomerToProfile = (crm: CrmCustomer): CustomerProfile => {
  const summary = mapCrmCustomerToSummary(crm);
  const gender = blank(crm.gender);

  return {
    ...summary,
    gender: gender === 'female' ? 'female' : 'male',
    customerSince: toDate(crm.customersince) ?? summary.lastInteractionAt ?? new Date(0),
    policies: [],
    claims: [],
  };
};
