/**
 * Push channel for «دادهٔ تیکت‌ها تغییر کرد» (a port, not a mock): on the real API this becomes a
 * WebSocket/SSE subscription; in the mock build devKpiSimulator publishes here whenever a ticket
 * arrives or moves on. The dashboard KPI cards, the charts and the ticket table all subscribe,
 * so every view shows the same figures without a page reload.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeToTicketFeed = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const publishTicketUpdate = () => {
  for (const listener of listeners) listener();
};
