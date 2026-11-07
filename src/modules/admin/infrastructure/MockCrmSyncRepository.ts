import type {
  CrmSyncRepository,
  CrmSyncResult,
  CrmSyncStatus,
} from '../domain/CrmSyncRepository';

/** Offline stand-in when VITE_API_BASE_URL is unset. */
export class MockCrmSyncRepository implements CrmSyncRepository {
  private status: CrmSyncStatus = {
    key: 'voc_fetch_all:updated',
    lastModified: '2025-07-19 16:49:47',
    lastTicketId: '99999999999999',
    chunksProcessed: 0,
    ticketsUpserted: 0,
    windowStart: '2025-07-19 16:49:47',
    updatedAt: new Date(),
    running: false,
  };

  async getStatus() {
    return { ...this.status, updatedAt: this.status.updatedAt };
  }

  async startSync(_options?: { reset?: boolean }): Promise<CrmSyncResult> {
    const windowStart = this.status.windowStart ?? '2025-07-19 16:49:47';
    this.status = {
      ...this.status,
      chunksProcessed: 1,
      ticketsUpserted: 10,
      lastModified: '2025-07-20 06:24:22',
      windowStart,
      updatedAt: new Date(),
      running: false,
    };

    return {
      chunks: 1,
      upserted: 10,
      deleted: 3,
      windowStart,
      lastModified: this.status.lastModified,
      lastTicketId: this.status.lastTicketId,
      hasMore: false,
      stoppedReason: 'complete',
    };
  }
}
