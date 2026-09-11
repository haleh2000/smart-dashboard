export const ticketPaths = {
  list: '/tickets',
  detail: (id: string) => `/tickets/${encodeURIComponent(id)}`,
  /** «تیکت‌های دیگر این مشتری»: the list searched by national id. */
  ofCustomer: (nationalId: string) => `/tickets?q=${encodeURIComponent(nationalId)}`,
} as const;
