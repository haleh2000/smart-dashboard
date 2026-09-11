/** Simulated network latency so loading states are visible during development. */
export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
