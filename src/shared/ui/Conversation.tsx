import { useState, type ReactNode } from 'react';
import type { Speaker, TranscriptLine, VoiceRecording } from '@/shared/domain/insights';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatPersianNumber } from '@/shared/lib/format';
import { sentimentMeta, speakerLabels } from './insightLabels';
import { SegmentedControl } from './SegmentedControl';
import './Conversation.css';

const BAR_COUNT = 48;

/** Deterministic pseudo-waveform so the same recording always draws the same shape. */
const waveform = (seed: string) => {
  let state = [...seed].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7) >>> 0;
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    state = (state * 1_103_515_245 + 12_345) >>> 0;
    const envelope = Math.sin((Math.PI * (i + 1)) / (BAR_COUNT + 1));
    return 18 + Math.round(((state % 1000) / 1000) * 70 * envelope);
  });
};

/** «فایل صوتی مکالمه + VoiceID». Plays the file when the Voices system exposes a URL. */
export function VoicePlayer({ recording }: { recording: VoiceRecording }) {
  return (
    <div className="voice-player">
      <div className="voice-player__meta">
        <span>
          Voice ID: <bdi className="voice-player__id">{formatPersianNumber(recording.voiceId)}</bdi>
        </span>
        <span>مدت: {formatDuration(recording.durationSec)}</span>
      </div>
      {recording.url ? (
        <audio className="voice-player__audio" controls preload="none" src={recording.url}>
          مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
        </audio>
      ) : (
        <>
          <div className="voice-player__wave" aria-hidden="true">
            {waveform(recording.voiceId).map((height, i) => (
              <span key={i} className="voice-player__bar" style={{ height: `${height}%` }} />
            ))}
          </div>
          <p className="voice-player__hint">فایل صوتی پس از اتصال به سامانه Voices قابل پخش است.</p>
        </>
      )}
    </div>
  );
}

type SpeakerFilter = 'all' | Speaker;

const speakerOptions: { value: SpeakerFilter; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'agent', label: speakerLabels.agent },
  { value: 'customer', label: speakerLabels.customer },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wraps every case-insensitive match of `term` in <mark>. */
const highlight = (text: string, term: string): ReactNode => {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, 'gi'));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="transcript__match">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

/**
 * «متن پیاده‌شده (Transcript)» — speech-to-text as a readable two-sided chat: one bubble per
 * utterance with its time and (when the AI scored it) its sentiment; searchable and filterable.
 */
export function Transcript({ lines }: { lines: readonly TranscriptLine[] }) {
  const [term, setTerm] = useState('');
  const [speaker, setSpeaker] = useState<SpeakerFilter>('all');

  if (lines.length === 0) return <p className="transcript__empty">متن مکالمه موجود نیست.</p>;

  const query = term.trim();
  const visible = lines.filter(
    (line) =>
      (speaker === 'all' || line.speaker === speaker) &&
      (!query || line.text.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="transcript-view">
      <div className="transcript-view__toolbar">
        <input
          type="search"
          aria-label="جستجو در متن مکالمه"
          className="form-input transcript-view__search"
          placeholder="جستجو در متن مکالمه…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <SegmentedControl
          label="گوینده"
          options={speakerOptions}
          value={speaker}
          onChange={setSpeaker}
        />
        <span className="transcript-view__count" role="status">
          {formatPersianNumber(visible.length)} از {formatPersianNumber(lines.length)} جمله
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="transcript__empty">جمله‌ای با این جستجو پیدا نشد.</p>
      ) : (
        <ol className="transcript">
          {visible.map((line, index) => (
            <li
              key={`${line.atSec}-${index}`}
              className={cn('transcript__line', `transcript__line--${line.speaker}`)}
            >
              <span className="transcript__avatar" aria-hidden="true">
                {speakerLabels[line.speaker].slice(0, 1)}
              </span>
              <div className="transcript__bubble">
                <span className="transcript__meta">
                  <span className="transcript__speaker">{speakerLabels[line.speaker]}</span>
                  <time className="transcript__time">{formatDuration(line.atSec)}</time>
                  {line.sentiment && (
                    <span
                      className={cn(
                        'transcript__sentiment',
                        `transcript__sentiment--${line.sentiment}`,
                      )}
                    >
                      {sentimentMeta[line.sentiment].label}
                    </span>
                  )}
                </span>
                <p className="transcript__text">{highlight(line.text, query)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
