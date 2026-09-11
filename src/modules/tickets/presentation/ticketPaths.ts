export const ticketPaths = {
  list: '/tickets',
  detail: (id: string) => `/tickets/${encodeURIComponent(id)}`,
} as const;
