import type { Priority, Sentiment } from '@/shared/domain/insights';
import { priorityMeta, sentimentMeta } from './insightLabels';
import { StatusBadge } from './StatusBadge';
import './InsightBadges.css';

export const SentimentBadge = ({ sentiment }: { sentiment: Sentiment }) => (
  <StatusBadge tone={sentimentMeta[sentiment].tone}>{sentimentMeta[sentiment].label}</StatusBadge>
);

export const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <StatusBadge tone={priorityMeta[priority].tone}>{priorityMeta[priority].label}</StatusBadge>
);

/** AI tags as a wrapping row of info badges. */
export const TagList = ({ tags }: { tags: readonly string[] }) => (
  <span className="tag-list">
    {tags.map((tag) => (
      <StatusBadge key={tag} tone="info">
        {tag}
      </StatusBadge>
    ))}
  </span>
);
