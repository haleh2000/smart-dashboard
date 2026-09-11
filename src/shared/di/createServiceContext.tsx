import { createContext, use, type ReactNode } from 'react';

/**
 * Creates a typed Provider/hook pair for injecting one dependency (usually a repository port).
 * Modules own their port and hook; src/app/container.ts decides which adapter is provided.
 */
export function createServiceContext<T>(name: string) {
  const Context = createContext<T | null>(null);

  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Context value={value}>{children}</Context>;
  }

  function useService(): T {
    const service = use(Context);
    if (service === null)
      throw new Error(`${name} is not provided. Register it in src/app/AppProviders.tsx.`);
    return service;
  }

  return [Provider, useService] as const;
}
