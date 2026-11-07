import type { Call, CallDirection, CallStatus } from './call';

/**
 * Nest / CRM `calls` row shape (from Excel call_records + CallEntity).
 */
export interface CrmCall {
  callid: string;
  calltype?: string | null;
  createdtime?: string | Date | null;
  nationalcode?: string | null;
  fname?: string | null;
  lname?: string | null;
  mobile?: string | null;
  accountname?: string | null;
  branchname?: string | null;
  productname?: string | null;
  inputchannel?: string | null;
  ownername?: string | null;
  direction?: string | null;
  status?: string | null;
  durationsec?: number | null;
  waitsec?: number | null;
  sentiment?: string | null;
  priority?: string | null;
}

const blank = (value: string | null | undefined) => {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const toDate = (value: string | Date | null | undefined): Date => {
  if (value === null || value === undefined || value === '') return new Date(0);
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const isDirection = (value: string): value is CallDirection =>
  value === 'inbound' || value === 'outbound';

const isStatus = (value: string): value is CallStatus =>
  value === 'ringing' || value === 'ongoing' || value === 'answered' || value === 'missed';

/** Maps Nest call row → SMART UI `Call`. */
export const mapCrmCallToCall = (crm: CrmCall): Call => {
  const fname = blank(crm.fname);
  const lname = blank(crm.lname);
  const fullName = [fname, lname].filter(Boolean).join(' ').trim() || undefined;
  const direction = blank(crm.direction);
  const status = blank(crm.status);

  return {
    id: String(crm.callid),
    direction: direction && isDirection(direction) ? direction : 'inbound',
    status: status && isStatus(status) ? status : 'answered',
    startedAt: toDate(crm.createdtime),
    durationSec: crm.durationsec ?? 0,
    waitSec: crm.waitsec ?? 0,
    caller: {
      mobile: blank(crm.mobile) ?? '',
      nationalId: blank(crm.nationalcode),
      fullName,
    },
    queue: blank(crm.productname) ?? blank(crm.calltype) ?? '',
    agent: blank(crm.ownername),
    transcript: [],
  };
};
