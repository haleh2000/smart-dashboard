import { Link } from 'react-router';
import { Button, Panel, StatusBadge } from '@/shared/ui';
import { ticketPaths } from '@/modules/tickets';
import { useAgentWorkspaceData } from '../hooks/agentWorkspaceQueries';
import type { NextAction } from '../../domain';
import './NextActionCard.css';

const ACTION_CONFIG: Record<NextAction['type'], { icon: string; label: string; tone: 'error' | 'warning' | 'info' }> = {
  slaWarning: { icon: '⏰', label: 'اخطار SLA', tone: 'error' },
  negativeSentiment: { icon: '😠', label: 'احساسات منفی', tone: 'error' },
  highPriority: { icon: '🔴', label: 'اولویت بالا', tone: 'warning' },
  followUp: { icon: '📋', label: 'نیاز به پیگیری', tone: 'info' },
};

export function NextActionCard() {
  const { data, isLoading, isError } = useAgentWorkspaceData();

  if (isLoading) {
    return (
      <Panel title="اقدام پیشنهادی" className="next-action-card loading">
        <div className="next-action-card__skeleton">
          <div className="skeleton skeleton--text" style={{ width: '50%' }} />
          <div className="skeleton skeleton--text" style={{ width: '80%' }} />
          <div className="skeleton skeleton--button" />
        </div>
      </Panel>
    );
  }
  if (isError) {
    return (
      <Panel title="اقدام پیشنهادی" className="next-action-card error">
        <div className="next-action-card__error">خطا در بارگذاری اقدام بعدی</div>
      </Panel>
    );
  }

  const nextAction = data?.nextAction;

  if (!nextAction) {
    return (
      <Panel title="اقدام پیشنهادی" className="next-action-card empty">
        <div className="next-action-card__empty-state">
          <span className="next-action-card__empty-icon" aria-hidden="true">✓</span>
          <p className="next-action-card__empty-text">هیچ اقدام فوری وجود ندارد</p>
          <span className="next-action-card__empty-hint">صفحه کار شما خالی است</span>
        </div>
      </Panel>
    );
  }

  const config = ACTION_CONFIG[nextAction.type];

  return (
    <Panel title="اقدام پیشنهادی" className="next-action-card">
      <div className="next-action-card__header">
        <span className="next-action-card__icon" aria-hidden="true">{config.icon}</span>
        <div className="next-action-card__meta">
          <h3 className="next-action-card__title">{nextAction.title}</h3>
          <StatusBadge tone={config.tone}>{config.label}</StatusBadge>
        </div>
      </div>
      <p className="next-action-card__description">{nextAction.description}</p>
      <div className="next-action-card__actions">
        <Link to={ticketPaths.detail(nextAction.ticketId)} className="next-action-card__link">
          <Button variant="primary" className="btn--sm">
            <span aria-hidden="true">📄</span>
            مشاهده تیکت
          </Button>
        </Link>
        <span className="next-action-card__severity">
          شدت: <strong>{nextAction.severity === 'high' ? 'بالا' : 'متوسط'}</strong>
        </span>
      </div>
    </Panel>
  );
}