import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as Auth from '@/modules/auth';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { Call } from '../../domain/call';
import type { CallRepository } from '../../domain/CallRepository';
import { CallRepositoryProvider } from '../callServices';
import { CallDetailPage } from './CallDetailPage';

// No signed-in session in this test: hide the agent-only categorization card.
vi.mock('@/modules/auth', async (importActual) => ({
  ...(await importActual<typeof Auth>()),
  useCan: () => () => false,
}));

const ai = { level1: 'پس از صدور', level2: 'پرداخت خسارت', level3: 'تاخیر در پرداخت' };

const call: Call = {
  id: 'C-7001',
  direction: 'inbound',
  status: 'answered',
  startedAt: new Date('2026-08-01T10:00:00Z'),
  durationSec: 90,
  waitSec: 10,
  caller: { mobile: '09120000000' },
  queue: 'خسارت خودرو',
  agent: 'سارا احمدی',
  subject: { level1: 'اطلاع‌رسانی', level2: 'محصولات', level3: 'ندارد' },
  transcript: [
    { speaker: 'agent', atSec: 0, text: 'سلام', sentiment: 'positive' },
    { speaker: 'customer', atSec: 4, text: 'پرداخت دیر شده', sentiment: 'negative' },
    { speaker: 'customer', atSec: 40, text: 'ممنون', sentiment: 'neutral' },
  ],
  analysis: {
    sentiment: 'negative',
    agentSentiment: 'positive',
    detectedSubject: ai,
    detectionConfidence: 0.82,
    priority: 'high',
    autoLabel: 'پرداخت خسارت — تاخیر در پرداخت',
    topic: 'پرداخت خسارت',
    tags: [],
    summary: 'خلاصه',
  },
};

const fakeRepository = (): CallRepository => ({
  list: vi.fn(),
  summarize: vi.fn(),
  getById: vi.fn(async () => call),
  getFilterOptions: vi.fn(async () => ({ agents: [], queues: [] })),
  getSubjectTree: vi.fn(async () => []),
  categorize: vi.fn(async (_id, subject) => ({ ...call, subject })),
  subscribeIncoming: vi.fn(() => () => {}),
});

describe('CallDetailPage', () => {
  it('compares the operator and AI subjects and accepts the AI suggestion', async () => {
    const repository = fakeRepository();
    renderWithProviders({
      initialPath: '/calls/C-7001',
      routes: [{ path: '/calls/:callId', element: <CallDetailPage /> }],
      wrapper: (children) => (
        <CallRepositoryProvider value={repository}>{children}</CallRepositoryProvider>
      ),
    });

    expect(await screen.findByText('عدم تطابق')).toBeInTheDocument();
    expect(screen.getByText('تشخیص هوش مصنوعی')).toBeInTheDocument();
    expect(screen.getByText('بهبود')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'پذیرش پیشنهاد AI' }));

    expect(repository.categorize).toHaveBeenCalledWith('C-7001', ai);
    expect(await screen.findByText('تطابق کامل')).toBeInTheDocument();
  });
});
