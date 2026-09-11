import { formatDateTime, formatFileSize } from '@/shared/lib/format';
import { ErrorState, InfoCard, SkeletonTable } from '@/shared/ui';
import { useTicketDocuments } from '../hooks/ticketQueries';
import './TicketNotes.css';

/** «اسناد»: files attached to the ticket in CRM. */
export function TicketDocuments({ ticketId }: { ticketId: string }) {
  const { data: documents, isPending, isError, refetch } = useTicketDocuments(ticketId);

  return (
    <InfoCard title="اسناد">
      {isPending ? (
        <SkeletonTable rows={2} />
      ) : isError ? (
        <ErrorState message="دریافت اسناد با خطا مواجه شد." onRetry={() => refetch()} />
      ) : documents.length === 0 ? (
        <p className="ticket-notes__empty">سند مرتبطی وجود ندارد.</p>
      ) : (
        <ul className="ticket-notes">
          {documents.map((document) => (
            <li key={document.id} className="ticket-notes__item">
              {document.url ? (
                <a href={document.url} target="_blank" rel="noreferrer">
                  {document.name}
                </a>
              ) : (
                <bdi>{document.name}</bdi>
              )}
              <span className="ticket-notes__meta">
                {' '}
                · {formatFileSize(document.sizeBytes)} · {formatDateTime(document.uploadedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}
