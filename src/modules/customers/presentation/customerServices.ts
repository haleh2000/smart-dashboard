import { createServiceContext } from '@/shared/di/createServiceContext';
import type { CustomerRepository } from '../domain/CustomerRepository';

export const [CustomerRepositoryProvider, useCustomerRepository] =
  createServiceContext<CustomerRepository>('CustomerRepository');
