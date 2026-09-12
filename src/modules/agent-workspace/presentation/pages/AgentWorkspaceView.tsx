import { PageHeader } from '@/shared/ui';
import {
  AgentStatusBar,
  QuickSearchCard,
  NextActionCard,
  AgentWorkQueue,
  PersonalShiftSummary,
} from '../components';
import './AgentWorkspaceView.css';

/**
 * Agent Workspace / My Desk view — operational dashboard for support agents.
 * Focuses on shift status, quick lookup, next best action, work queue, and personal stats.
 */
export function AgentWorkspaceView() {
  return (
    <section className="agent-workspace">
      <PageHeader
        title="محل کار من"
        subtitle="نمای عملیاتی برای مدیریت شیفت، صف کار و اقدامات فوری"
      />

      <div className="agent-workspace__grid">
        <aside className="agent-workspace__sidebar">
          <AgentStatusBar />
          <PersonalShiftSummary />
        </aside>

        <main className="agent-workspace__main">
          <section className="agent-workspace__section" aria-label="جستجوی سریع">
            <QuickSearchCard />
          </section>

          <section className="agent-workspace__section" aria-label="اقدام پیشنهادی">
            <NextActionCard />
          </section>

          <section className="agent-workspace__section agent-workspace__section--primary" aria-label="صف کار">
            <AgentWorkQueue />
          </section>
        </main>
      </div>
    </section>
  );
}