export const customerPaths = {
  list: '/customers',
  profile: (nationalId: string) => `/customers/${encodeURIComponent(nationalId)}`,
} as const;

/**
 * Links out of Customer 360 into the tickets and calls sections. Kept as plain strings here
 * (they mirror ticketPaths / callPaths) so this module doesn't import its neighbours at load time.
 */
export const interactionPaths = {
  ticket: (id: string) => `/tickets/${encodeURIComponent(id)}`,
  call: (id: string) => `/calls/${encodeURIComponent(id)}`,
  ticketsOf: (nationalId: string) => `/tickets?q=${encodeURIComponent(nationalId)}`,
  callsOf: (mobile: string) => `/calls?q=${encodeURIComponent(mobile)}`,
} as const;
