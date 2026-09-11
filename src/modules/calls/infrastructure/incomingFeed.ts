import type { IncomingCall } from '../domain/call';

/**
 * Development-only in-memory stand-in for the call center's push channel (WebSocket/SSE on
 * the real API). MockCallRepository subscribes here; devCallSimulator publishes.
 */
type Listener = (call: IncomingCall) => void;

const listeners = new Set<Listener>();

export const subscribeToFeed = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const publishToFeed = (call: IncomingCall) => {
  for (const listener of listeners) listener(call);
};
