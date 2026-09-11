import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';

interface Options {
  routes: RouteObject[];
  initialPath: string;
  /** Wrap with module providers (e.g. a repository fake). */
  wrapper?: (children: ReactNode) => ReactNode;
}

/** Renders routes with a fresh QueryClient (no retries) and an in-memory router. */
export function renderWithProviders({ routes, initialPath, wrapper = (c) => c }: Options) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  const view = render(
    <QueryClientProvider client={queryClient}>
      {wrapper(<RouterProvider router={router} />)}
    </QueryClientProvider>,
  );
  return { ...view, router };
}
