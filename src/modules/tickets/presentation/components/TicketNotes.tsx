import { useState, type FormEvent } from 'react';
import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import { Button, ErrorState, InfoCard, SkeletonTable } from '@/shared/ui';
import { NOTE_MAX_LENGTH, validateNote } from '../../domain/ticket';
import { useAddTicketNote, useTicketNotes } from '../hooks/ticketQueries';
import { noteErrorMessages } from '../ticketLabels';
import './TicketNotes.css';

const COMPACT_COUNT = 2;

interface TicketNotesProps {
  ticketId: string;
  /** Summary-tab variant: latest notes only, with a link to the notes tab. */
  compact?: boolean;
  onShowAll?: () => void;
}

/** «یادداشت‌ها»: latest notes + «افزودن یادداشت». */
export function TicketNotes({ ticketId, compact = false, onShowAll }: TicketNotesProps) {
  const { data: notes, isPending, isError, refetch } = useTicketNotes(ticketId);
  const addNote = useAddTicketNote(ticketId);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateNote(draft);
    setError(problem && noteErrorMessages[problem]);
    if (!problem) addNote.mutate(draft, { onSuccess: () => setDraft('') });
  };

  const visible = compact ? notes?.slice(0, COMPACT_COUNT) : notes;

  return (
    <InfoCard
      title={compact ? 'آخرین یادداشت‌ها' : 'یادداشت‌ها'}
      actions={
        compact &&
        notes &&
        notes.length > COMPACT_COUNT && (
          <Button variant="ghost" className="btn--small" onClick={onShowAll}>
            همه ({formatPersianNumber(notes.length)})
          </Button>
        )
      }
    >
      {!compact && (
        <form className="ticket-notes__form" onSubmit={submit}>
          <label className="form-field">
            <span className="form-field__label">افزودن یادداشت</span>
            <textarea
              className="form-input form-textarea"
              value={draft}
              maxLength={NOTE_MAX_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="یادداشت داخلی برای همکاران…"
            />
          </label>
          {(error || addNote.isError) && (
            <p className="ticket-notes__error" role="alert">
              {error ?? 'ثبت یادداشت با خطا مواجه شد.'}
            </p>
          )}
          <Button type="submit" disabled={addNote.isPending}>
            {addNote.isPending ? 'در حال ثبت…' : 'ثبت یادداشت'}
          </Button>
        </form>
      )}

      {isPending ? (
        <SkeletonTable rows={2} />
      ) : isError ? (
        <ErrorState message="دریافت یادداشت‌ها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : visible?.length ? (
        <ul className="ticket-notes">
          {visible.map((note) => (
            <li key={note.id} className="ticket-notes__item">
              <span className="ticket-notes__meta">
                {note.author} · {formatDateTime(note.at)}
              </span>
              <p className="ticket-notes__text">{note.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ticket-notes__empty">توضیحی وجود ندارد.</p>
      )}
    </InfoCard>
  );
}
