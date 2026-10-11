import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import type { SentimentLevel, SentimentLevelRow } from '../../domain/sentimentLevels';
import { dominantLevel } from '../../domain/sentimentLevels';
import { formatScore } from './sentimentKit';
import './SentimentFaces.css';

const SENTIMENT_FACE_LABELS: Record<SentimentLevel, string> = {
  angry: 'عصبانی',
  dissatisfied: 'ناراضی',
  neutral: 'خنثی',
  satisfied: 'راضی',
  verySatisfied: 'کاملا راضی',
};

interface FaceIconProps {
  level: SentimentLevel;
}

/**
 * Hand-drawn illustrated mood faces in one consistent stroke style — never
 * Unicode emojis. The head disc is tinted per mood; features share one
 * stroke treatment (round caps, tabular geometry) so the five read as a set.
 */
function FaceIcon({ level }: FaceIconProps) {
  return (
    <svg viewBox="0 0 72 72" className={cn('face', `face--${level}`)} aria-hidden="true">
      <circle cx="36" cy="36" r="29" className="face__disc" />
      {level === 'angry' && (
        <g className="face__features">
          <path d="M22 22 L32 27" />
          <path d="M50 22 L40 27" />
          <circle cx="28" cy="36" r="2.8" className="face__dot" />
          <circle cx="44" cy="36" r="2.8" className="face__dot" />
          <path d="M26 54 Q36 45 46 54" />
        </g>
      )}
      {level === 'dissatisfied' && (
        <g className="face__features">
          <path d="M24 25 L32 27" />
          <path d="M48 25 L40 27" />
          <circle cx="28" cy="36" r="2.8" className="face__dot" />
          <circle cx="44" cy="36" r="2.8" className="face__dot" />
          <path d="M27 52 Q36 47 45 52" />
        </g>
      )}
      {level === 'neutral' && (
        <g className="face__features">
          <path d="M25 27 L31 27" />
          <path d="M41 27 L47 27" />
          <circle cx="28" cy="36" r="2.8" className="face__dot" />
          <circle cx="44" cy="36" r="2.8" className="face__dot" />
          <path d="M28 50 L44 50" />
        </g>
      )}
      {level === 'satisfied' && (
        <g className="face__features">
          <path d="M24 27 Q28 24 32 27" />
          <path d="M40 27 Q44 24 48 27" />
          <circle cx="28" cy="36" r="2.8" className="face__dot" />
          <circle cx="44" cy="36" r="2.8" className="face__dot" />
          <ellipse cx="23" cy="43" rx="3.2" ry="2.2" className="face__cheek" />
          <ellipse cx="49" cy="43" rx="3.2" ry="2.2" className="face__cheek" />
          <path d="M26 43 Q36 52 46 43" />
        </g>
      )}
      {level === 'verySatisfied' && (
        <g className="face__features">
          <path d="M23 25 Q28 21 33 25" />
          <path d="M39 25 Q44 21 49 25" />
          <path d="M23 36 Q28 31 33 36" />
          <path d="M39 36 Q44 31 49 36" />
          <ellipse cx="23" cy="43" rx="3.2" ry="2.2" className="face__cheek" />
          <ellipse cx="49" cy="43" rx="3.2" ry="2.2" className="face__cheek" />
          <path d="M24 41 Q36 57 48 41 Z" className="face__smile" />
        </g>
      )}
    </svg>
  );
}

interface CustomerSentimentFacesProps {
  /** The five levels with the real counts behind them, most negative first. */
  rows: readonly SentimentLevelRow[];
  /** The overall -1..1 score of the side these faces describe. */
  score: number;
  /** How many conversations the counts add up to. */
  analyzed: number;
  selected?: string;
  onSelect: (sentiment: string) => void;
}

export function CustomerSentimentFaces({
  rows,
  score,
  analyzed,
  selected,
  onSelect,
}: CustomerSentimentFacesProps) {
  const dominant = dominantLevel(rows);
  const hasSelection = selected !== undefined;

  const [clicked, setClicked] = useState<SentimentLevel | undefined>(undefined);
  if (selected === undefined && clicked !== undefined) setClicked(undefined);

  const active =
    clicked !== undefined && selected !== undefined && clicked === selected
      ? clicked
      : selected !== undefined
        ? rows.find((row) => row.level === selected)?.level
        : undefined;

  const handleSelect = (level: SentimentLevel) => {
    if (active === level && selected === level) {
      onSelect(level);
      setClicked(undefined);
    } else {
      if (selected !== level) onSelect(level);
      setClicked(level);
    }
  };

  return (
    <div className="sentiment-faces">
      <div className="sentiment-faces__summary">
        <p className="sentiment-faces__headline">
          حال غالب مشتریان: <strong>{SENTIMENT_FACE_LABELS[dominant]}</strong>
        </p>
        <p className="sentiment-faces__meta">
          <span className="sentiment-faces__score">{formatScore(score)}</span>
          <span>
            امتیاز کلی از {formatPersianNumber(analyzed)} مکالمه تحلیل‌شده
          </span>
        </p>
      </div>
      <ul className="sentiment-faces__grid" aria-label="توزیع احساس مشتریان">
        {rows.map(({ level, count, share }) => {
          const isActive = active === level;
          const isDimmed = hasSelection && !isActive;
          return (
            <li key={level}>
              <button
                type="button"
                className={cn(
                  'sentiment-faces__card',
                  `sentiment-faces__card--${level}`,
                  isActive && 'sentiment-faces__card--active',
                  isDimmed && 'sentiment-faces__card--dimmed',
                )}
                aria-pressed={isActive}
                aria-label={`${SENTIMENT_FACE_LABELS[level]}: ${formatPersianNumber(count)} مشتری (${formatPercent(share)})`}
                onClick={() => handleSelect(level)}
              >
                <FaceIcon level={level} />
                <span className="sentiment-faces__label">{SENTIMENT_FACE_LABELS[level]}</span>
                <span className="sentiment-faces__count">{formatPersianNumber(count)}</span>
                <span className="sentiment-faces__share">{formatPercent(share)}</span>
                <span className="sentiment-faces__meter" aria-hidden="true">
                  <span
                    className="sentiment-faces__meter-fill"
                    style={{ width: `${Math.round(share * 100)}%` }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
