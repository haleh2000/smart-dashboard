import { ApiError, type HttpClient } from '@/shared/http';
import type { Page } from '@/shared/domain/pagination';
import {
  mapCrmCustomerToProfile,
  mapCrmCustomerToSummary,
  type CrmCustomer,
} from '../domain/crmCustomer';
import type {
  CustomerProfile,
  CustomerSummary,
  Interaction,
  SentimentPoint,
} from '../domain/customer';
import type {
  CustomerOverview,
  CustomerQuery,
  CustomerRepository,
} from '../domain/CustomerRepository';

type CustomerPageDto = {
  items: CrmCustomer[];
  total: number;
  page: number;
  pageSize: number;
};

/** Talks to VOC Panel Nest `/customer` endpoints. */
export class HttpCustomerRepository implements CustomerRepository {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async list(query: CustomerQuery): Promise<Page<CustomerSummary>> {
    const page = await this.#http.get<CustomerPageDto>('/customer', {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        status: query.status,
        kind: query.kind,
        vipOnly: query.vipOnly,
        sort: query.sort.field,
        dir: query.sort.direction,
      },
    });

    return {
      items: page.items.map(mapCrmCustomerToSummary),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  getOverview() {
    return this.#http.get<CustomerOverview>('/customer/overview');
  }

  async getProfile(nationalId: string): Promise<CustomerProfile | null> {
    try {
      const raw = await this.#http.get<CrmCustomer>(
        `/customer/${encodeURIComponent(nationalId)}`,
      );
      return mapCrmCustomerToProfile(raw);
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return null;
      throw error;
    }
  }

  async getInteractions(_nationalId: string): Promise<Interaction[]> {
    return [];
  }

  async getSentimentHistory(_nationalId: string): Promise<SentimentPoint[]> {
    return [];
  }
}
