/** Single place that reads build-time environment variables. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  /** True when the app should call the Nest API instead of mock auth. */
  useApiAuth: Boolean(import.meta.env.VITE_API_BASE_URL),
  isDev: import.meta.env.DEV,
} as const;
