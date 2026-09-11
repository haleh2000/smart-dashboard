import type { CSSProperties } from 'react';
import { SENTIMENTS } from '@/shared/domain/insights';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { sentimentMeta } from '@/shared/ui';
import type { SentimentSplit } from '../../domain/analytics';
import { formatScore, scoreSentiment, sentimentColor } from './sentimentKit';
import './SentimentGauge.css';

interface SentimentGaugeProps {
  title: string;
  split: SentimentSplit;
  /** Color of the value arc. */
  color: string;
}

// Semicircle centred at (100, 100), radius 80: from the left end (−100) to the right end (+100).
const ARC = 'M 20 100 A 80 80 0 0 1 180 100';
const zone = (from: number, to: number) => {
  const point = (t: number) => {
    const angle = Math.PI * (1 - t);
    return `${100 + 80 * Math.cos(angle)} ${100 - 80 * Math.sin(angle)}`;
  };
  return `M ${point(from)} A 80 80 0 0 1 ${point(to)}`;
};

/** «امتیاز احساس» of one side as a speedometer: −۱۰۰ (منفی) … +۱۰۰ (مثبت). Animated on mount. */
export function SentimentGauge({ title, split, color }: SentimentGaugeProps) {
  const total = split.positive + split.neutral + split.negative;
  const fill = ((split.score + 1) / 2) * 100;
  const mood = scoreSentiment(split.score);

  return (
    <figure className="gauge" aria-label={`${title}: ${formatScore(split.score)}`}>
      <figcaption className="gauge__title">{title}</figcaption>
      <svg viewBox="0 0 200 118" className="gauge__svg" aria-hidden="true">
        <path d={zone(0, 0.4)} className="gauge__zone" stroke={sentimentColor.negative} />
        <path d={zone(0.4, 0.6)} className="gauge__zone" stroke={sentimentColor.neutral} />
        <path d={zone(0.6, 1)} className="gauge__zone" stroke={sentimentColor.positive} />
        <path d={ARC} className="gauge__track" pathLength={100} />
        <path
          d={ARC}
          className="gauge__value"
          pathLength={100}
          stroke={color}
          style={{ '--gauge-fill': `${fill} 100` } as CSSProperties}
        />
        <g
          className="gauge__needle"
          style={{ '--gauge-angle': `${split.score * 90}deg` } as CSSProperties}
        >
          <line x1="100" y1="100" x2="100" y2="34" />
          <circle cx="100" cy="100" r="7" />
        </g>
        <text x="22" y="116" className="gauge__end">
          −۱۰۰
        </text>
        <text x="178" y="116" className="gauge__end" textAnchor="end">
          +۱۰۰
        </text>
      </svg>
      <div className="gauge__readout">
        <strong className={`gauge__score gauge__score--${mood}`}>{formatScore(split.score)}</strong>
        <span className="gauge__mood">{sentimentMeta[mood].label}</span>
      </div>
      <dl className="gauge__counts">
        {SENTIMENTS.map((sentiment) => (
          <div key={sentiment} className="gauge__count">
            <dt>
              <span className="gauge__dot" style={{ background: sentimentColor[sentiment] }} />
              {sentimentMeta[sentiment].label}
            </dt>
            <dd>
              {formatPersianNumber(split[sentiment])}
              <small>{formatPercent(total ? split[sentiment] / total : 0)}</small>
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
