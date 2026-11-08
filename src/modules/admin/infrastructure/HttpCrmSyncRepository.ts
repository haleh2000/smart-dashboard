import type { HttpClient } from '@/shared/http';
import type {
  CrmSyncRepository,
  CrmSyncStartResult,
  CrmSyncStatus,
  CrmSyncStream,
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

  startSync(stream: CrmSyncStream, options?: { reset?: boolean }) {
    return this.#http.post<CrmSyncStartResult>(`/crm/sync/${stream}`, {
      body: options?.reset ? { reset: true } : {},
    });
  }
}
