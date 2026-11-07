/** CRM VOC sync status from Nest `GET /crm/sync/status`. */
export interface CrmSyncStatus {
  key: string;
  lastModified: string;
  lastTicketId: string;
  chunksProcessed: number;
  ticketsUpserted: number;
  updatedAt?: string | Date;
  /** Rolling window start used for the next/current sync (now - 1 year). */
  windowStart?: string;
  running: boolean;
}

/** Result of Nest `POST /crm/sync`. */
export interface CrmSyncResult {
  chunks: number;
  upserted: number;
  deleted: number;
  windowStart: string;
  lastModified: string;
  lastTicketId: string;
  hasMore: boolean;
  stoppedReason: 'complete' | 'disabled' | 'crm_error' | 'empty_chunk';
}

export interface CrmSyncRepository {
  getStatus(): Promise<CrmSyncStatus>;
  /** Pull CRM chunks until has_more=false and upsert into tickets (needs company VPN). */
  startSync(options?: { reset?: boolean }): Promise<CrmSyncResult>;
}
