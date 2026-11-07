import type { HttpClient } from '@/shared/http';
import type {
  CrmSyncRepository,
  CrmSyncResult,
  CrmSyncStatus,
} from '../domain/CrmSyncRepository';

/** Talks to VOC Panel Nest CRM sync endpoints. */
export class HttpCrmSyncRepository implements CrmSyncRepository {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  getStatus() {
    return this.#http.get<CrmSyncStatus>('/crm/sync/status');
  }

  startSync(options?: { reset?: boolean }) {
    return this.#http.post<CrmSyncResult>('/crm/sync', {
      body: { reset: options?.reset ?? false },
    });
  }
}