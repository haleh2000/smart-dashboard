import type { TranscriptLine, VoiceRecording } from '@/shared/domain/insights';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatPersianNumber } from '@/shared/lib/format';
import { speakerLabels } from './insightLabels';
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

/** «متن پیاده‌شده (Transcript)» as a two-sided conversation. */
export function Transcript({ lines }: { lines: readonly TranscriptLine[] }) {
  if (lines.length === 0) return <p className="transcript__empty">متن مکالمه موجود نیست.</p>;

  return (
    <ol className="transcript">
      {lines.map((line, index) => (
        <li key={index} className={cn('transcript__line', `transcript__line--${line.speaker}`)}>
          <span className="transcript__speaker">
            {speakerLabels[line.speaker]} · {formatDuration(line.atSec)}
          </span>
          <p className="transcript__text">{line.text}</p>
        </li>
      ))}
    </ol>
  );
}
