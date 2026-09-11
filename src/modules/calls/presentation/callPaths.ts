export const callPaths = {
  list: '/calls',
  detail: (id: string) => `/calls/${encodeURIComponent(id)}`,
  // Paths owned by other modules, spelled out here to keep calls free of an import cycle with
  // customers/tickets (both link back to calls). Keep in sync with customerPaths / ticketPaths.
  customerProfile: (nationalId: string) => `/customers/${encodeURIComponent(nationalId)}`,
  ticket: (id: string) => `/tickets/${encodeURIComponent(id)}`,
} as const;
