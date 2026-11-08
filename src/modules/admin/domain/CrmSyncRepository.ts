/** One CRM stream cursor from Nest `GET /crm/sync/status`. */
export interface CrmStreamStatus {
  stream: 'tickets' | 'calls';
  lastTicketId: string;
  chunksProcessed: number;
  itemsUpserted: number;
  updatedAt?: string | null;
  lastRunAt?: string | null;
  lastStoppedReason?: string | null;
  lastError?: string | null;
  running: boolean;
  fetchUrl: string;
}

/** Combined ticket + call sync status. */
export interface CrmSyncStatus {
  tickets: CrmStreamStatus;
  calls: CrmStreamStatus;
  cursorFile: string;
}

/** Result of Nest `POST /crm/sync/tickets|calls` (job start ack). */
export interface CrmSyncStartResult {
  started: boolean;
  stream: 'tickets' | 'calls';
  running: boolean;
  lastTicketId: string;
}

export type CrmSyncStream = 'tickets' | 'calls';

export interface CrmSyncRepository {
  getStatus(): Promise<CrmSyncStatus>;
  /** Start background job that pages CRM type=new until has_more=false. */
  startSync(
    stream: CrmSyncStream,
    options?: { reset?: boolean },
  ): Promise<CrmSyncStartResult>;
}
