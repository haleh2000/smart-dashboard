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
