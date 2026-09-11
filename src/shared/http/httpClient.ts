import { ApiError } from './ApiError';

type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface HttpClient {
  get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T>;
  post<T>(path: string, options?: RequestOptions): Promise<T>;
  put<T>(path: string, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
}

export interface HttpClientConfig {
  baseUrl: string;
  /** Returns the current access token, if any. Kept as a callback so auth stays out of this file. */
  getToken?: () => string | null;
  fetchFn?: typeof fetch;
}

const buildUrl = (baseUrl: string, path: string, query?: RequestOptions['query']) => {
  const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '')
      url.searchParams.set(key, String(value));
  }
  return url;
};

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json') ? response.json() : response.text();
};

/**
 * Thin JSON-over-fetch client used by every HTTP repository adapter.
 * Non-2xx responses are thrown as {@link ApiError}.
 */
export const createHttpClient = ({
  baseUrl,
  getToken,
  fetchFn = fetch,
}: HttpClientConfig): HttpClient => {
  const request = async <T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetchFn(buildUrl(baseUrl, path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

    const body = await parseBody(response);
    if (!response.ok) throw new ApiError(response.status, body);
    return body as T;
  };

  return {
    get: (path, options) => request('GET', path, options),
    post: (path, options) => request('POST', path, options),
    put: (path, options) => request('PUT', path, options),
    patch: (path, options) => request('PATCH', path, options),
    delete: (path, options) => request('DELETE', path, options),
  };
};
