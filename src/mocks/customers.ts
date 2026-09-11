import type { Claim, CustomerProfile, Policy } from '@/modules/customers';
import { createRandom } from './random';
import {
  agents,
  branches,
  cities,
  corporateNames,
  DAY,
  femaleNames,
  firstNames,
  insuranceLines,
  lastNames,
  NOW,
} from './reference';

/** A CRM customer plus the home branch the fake backend uses when aggregating calls. */
export type MockCustomer = CustomerProfile & { branch: string };

const random = createRandom(7);

const plate = () =>
  `${random.digits(2)}${random.pick(['ب', 'ج', 'د', 'س', 'ص', 'ط', 'ق', 'ل', 'م', 'ن', 'و', 'ه', 'ی'])}${random.digits(3)}-${random.digits(2)}`;

const insuredItemFor = (line: string, corporateName?: string) => {
  if (line.includes('خودرو')) return `پلاک ${plate()}`;
  if (line === 'آتش‌سوزی') return `ملک مسکونی — ${random.pick(cities)}`;
  if (line === 'درمان تکمیلی سازمانی') return `قرارداد گروهی ${corporateName ?? 'سازمانی'}`;
  return 'بیمه‌شده اصلی و افراد تحت تکفل';
};

const makePolicy = (corporateName?: string): Policy => {
  const line = corporateName
    ? random.pick(['درمان تکمیلی سازمانی', 'درمان تکمیلی سازمانی', 'ثالث خودرو'])
    : random.pick(insuranceLines.filter((l) => l !== 'درمان تکمیلی سازمانی'));
  const start = NOW - Math.floor(random.next() * 700) * DAY;
  const end = start + 365 * DAY;
  const status = random.next() < 0.06 ? 'cancelled' : end > NOW ? 'active' : 'expired';
  return {
    number: `${random.pick(['1402', '1403', '1404', '1405'])}/${random.digits(2)}/${random.digits(6)}`,
    line,
    status,
    startDate: new Date(start),
    endDate: new Date(end),
    premium: (4 + Math.floor(random.next() * 60)) * 1_000_000,
    insuredItem: insuredItemFor(line, corporateName),
  };
};

const makeClaim = (policy: Policy): Claim => {
  const filedAt = new Date(policy.startDate.getTime() + Math.floor(random.next() * 300) * DAY);
  const status = random.pick([
    'filed',
    'underReview',
    'approved',
    'paid',
    'paid',
    'rejected',
  ] as const);
  const amount = (2 + Math.floor(random.next() * 180)) * 1_000_000;
  return {
    number: `CL-${random.digits(7)}`,
    policyNumber: policy.number,
    line: policy.line,
    filedAt: filedAt.getTime() > NOW ? new Date(NOW - 3 * DAY) : filedAt,
    status,
    amount,
    paidAmount: status === 'paid' ? Math.round(amount * (0.6 + random.next() * 0.4)) : undefined,
  };
};

export const mockCustomers: MockCustomer[] = Array.from({ length: 160 }, (_, index) => {
  const firstName = random.pick(firstNames);
  const corporate = random.next() < 0.3;
  const corporateName = corporate ? random.pick(corporateNames) : undefined;
  const policies = Array.from({ length: 1 + Math.floor(random.next() * 3) }, () =>
    makePolicy(corporateName),
  );
  const claims = policies.flatMap((policy) =>
    random.next() < 0.55
      ? Array.from({ length: 1 + Math.floor(random.next() * 2) }, () => makeClaim(policy))
      : [],
  );
  const city = random.pick(cities);

  return {
    nationalId: random.digits(10),
    fullName: `${firstName} ${random.pick(lastNames)}`,
    mobile: `09${random.pick(['12', '13', '19', '35', '36', '01', '21'])}${random.digits(7)}`,
    status: random.next() < 0.85 ? 'active' : random.next() < 0.7 ? 'inactive' : 'suspended',
    kind: corporate ? 'corporate' : 'individual',
    corporateName,
    city,
    branch: random.next() < 0.5 ? city : random.pick(branches),
    isVip: index % 11 === 0,
    gender: femaleNames.has(firstName) ? 'female' : 'male',
    birthDate: new Date(NOW - (20 + Math.floor(random.next() * 45)) * 365 * DAY),
    email: random.next() < 0.5 ? `user${index + 1}@example.com` : undefined,
    address: `${city}، خیابان ${random.pick(['آزادی', 'انقلاب', 'ولیعصر', 'امام', 'بهار'])}، پلاک ${random.digits(2)}`,
    agentName:
      random.next() < 0.6 ? `نمایندگی ${random.digits(4)} — ${random.pick(agents)}` : undefined,
    customerSince: new Date(NOW - (200 + Math.floor(random.next() * 2500)) * DAY),
    policies,
    claims,
    // Derived from tickets/calls by the mock repositories.
    activePolicyCount: policies.filter((p) => p.status === 'active').length,
    openTicketCount: 0,
  };
});

/** Heavier weight on the first customers so some of them become repeat callers. */
export const pickCustomer = (next: () => number) =>
  mockCustomers[Math.floor(next() ** 1.8 * mockCustomers.length)]!;
