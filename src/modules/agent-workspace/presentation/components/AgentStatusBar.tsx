import { useCurrentUser } from '@/modules/auth';
import { Button, Panel } from '@/shared/ui';
import { formatPersianNumber } from '@/shared/lib/format';
import { useAgentWorkspaceData, useUpdateAgentStatus } from '../hooks/agentWorkspaceQueries';
import type { AgentStatus } from '../../domain';
import './AgentStatusBar.css';

const STATUS_OPTIONS: readonly { value: AgentStatus; label: string; icon: string }[] = [
  { value: 'ready', label: 'آماده', icon: '●' },
  { value: 'inCall', label: 'در تماس', icon: '◉' },
  { value: 'wrapUp', label: 'اتمام تماس', icon: '◎' },
  { value: 'break', label: 'استراحت', icon: '○' },
];

export function AgentStatusBar() {
  const { data, isLoading, isError } = useAgentWorkspaceData();
  const updateStatus = useUpdateAgentStatus();
  const { fullName } = useCurrentUser();

  if (isLoading) {
    return (
      <Panel title="وضعیت شیفت" className="agent-status-bar loading">
        <div className="agent-status-bar__skeleton">
          <div className="skeleton skeleton--text" style={{ width: '60%' }} />
          <div className="skeleton skeleton--text" style={{ width: '40%' }} />
          <div className="skeleton skeleton--badge" />
          <div className="skeleton skeleton--text" style={{ width: '80%' }} />
        </div>
      </Panel>
    );
  }
  if (isError) {
    return (
      <Panel title="وضعیت شیفت" className="agent-status-bar error">
        <div className="agent-status-bar__error">خطا در بارگذاری وضعیت</div>
      </Panel>
    );
  }

  const { shiftState } = data!;
  const isCurrentStatus = (status: AgentStatus) => status === shiftState.status;

  return (
    <Panel title="وضعیت شیفت" className="agent-status-bar">
      <div className="agent-status-bar__identity">
        <span className="agent-status-bar__role">کارشناس پشتیبانی</span>
        <span className="agent-status-bar__name">{fullName}</span>
      </div>

      <div className="agent-status-bar__current">
        <div className="agent-status-bar__badge-wrapper">
          <span
            className={`agent-status-bar__badge agent-status-bar__badge--${shiftState.status}`}
            data-status={shiftState.status}
          >
            <span className="agent-status-bar__dot" aria-hidden="true" />
            {shiftState.statusLabel}
          </span>
          {shiftState.status === 'inCall' && (
            <span className="agent-status-bar__live-indicator" aria-live="polite">
              <span className="agent-status-bar__pulse" aria-hidden="true" />
              تماس فعال
            </span>
          )}
        </div>
        <time
          className="agent-status-bar__duration"
          dateTime={shiftState.statusSince.toISOString()}
        >
          مدت: {formatPersianNumber(Math.floor((Date.now() - shiftState.statusSince.getTime()) / 1000 / 60))} دقیقه
        </time>
      </div>

      <div className="agent-status-bar__actions" role="radiogroup" aria-label="تغییر وضعیت">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={isCurrentStatus(option.value) ? 'primary' : 'ghost'}
            role="radio"
            aria-checked={isCurrentStatus(option.value)}
            aria-label={`${option.label}${isCurrentStatus(option.value) ? ' (فعالت)' : ''}`}
            onClick={() => updateStatus.mutate(option.value)}
            disabled={updateStatus.isPending}
            className="agent-status-bar__action-btn"
          >
            <span className="agent-status-bar__btn-icon" aria-hidden="true">{option.icon}</span>
            <span className="agent-status-bar__btn-label">{option.label}</span>
          </Button>
        ))}
      </div>
    </Panel>
  );
}