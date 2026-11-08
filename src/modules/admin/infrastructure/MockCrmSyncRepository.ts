import type {
  CrmStreamStatus,
  CrmSyncRepository,
  CrmSyncStartResult,
  CrmSyncStatus,
  CrmSyncStream,
} from '../domain/CrmSyncRepository';

const streamStatus = (
  stream: CrmSyncStream,
  fetchUrl: string,
): CrmStreamStatus => ({
  stream,
  lastTicketId: '0',
  chunksProcessed: 0,
  itemsUpserted: 0,
  updatedAt: null,
  lastRunAt: null,
  lastStoppedReason: null,
  lastError: null,
  running: false,
  fetchUrl,
});

/** Offline stand-in when VITE_API_BASE_URL is unset. */
export class MockCrmSyncRepository implements CrmSyncRepository {
  private status: CrmSyncStatus = {
    tickets: streamStatus(
      'tickets',
      'https://crm.dayins.com/panel/rest/voc_fetch_all/',
    ),
    calls: streamStatus(
      'calls',
      'https://crm.dayins.com/panel/rest/voc_fetch_all_calls/',
    ),
    cursorFile: 'crm-sync-cursors.json',
  };

  async getStatus() {
    return structuredClone(this.status);
  }

  async startSync(
    stream: CrmSyncStream,
    _options?: { reset?: boolean },
  ): Promise<CrmSyncStartResult> {
    const now = new Date().toISOString();
    this.status = {
      ...this.status,
      [stream]: {
        ...this.status[stream],
        lastTicketId: stream === 'tickets' ? '6104562' : '11079825',
        chunksProcessed: this.status[stream].chunksProcessed + 1,
        itemsUpserted: this.status[stream].itemsUpserted + 10,
        updatedAt: now,
        lastRunAt: now,
        lastStoppedReason: 'complete',
        lastError: null,
        running: false,
      },
    };

    return {
      started: true,
      stream,
      running: false,
      lastTicketId: this.status[stream].lastTicketId,
    };
  }
}
