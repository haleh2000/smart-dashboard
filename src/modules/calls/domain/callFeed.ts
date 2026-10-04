/**
 * Push channel for «دادهٔ تماس‌ها تغییر کرد» (a port, not a mock): on the real API this becomes a
 * WebSocket/SSE subscription; in the mock build devCallSimulator and MockCallRepository publish
 * here whenever a call arrives, rings on or gets categorized. The call table, its summary strip
 * and the dashboard call cards all subscribe, so every view shows the same figures without a
 * page reload.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeToCallFeed = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const publishCallUpdate = () => {
  for (const listener of listeners) listener();
};
