import { useCan } from '@/modules/auth';
import { simulateIncomingCall } from '@/modules/calls';
import './DevRoleSwitcher.css';

/**
 * Development-only: rings a fake incoming call so the popup can be tried without the call
 * center. Remove together with MockCallRepository once the real feed exists.
 */
export function DevCallButton() {
  const can = useCan();
  if (!can('calls.receive')) return null;

  return (
    <button
      type="button"
      className="dev-role dev-role__call"
      onClick={() => simulateIncomingCall()}
    >
      تماس آزمایشی (dev)
    </button>
  );
}
