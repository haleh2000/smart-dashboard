import { ApiError } from './ApiError';
import { createHttpClient } from './httpClient';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('createHttpClient', () => {
  it('builds the URL with query params and sends the bearer token', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createHttpClient({
      baseUrl: 'https://api.test/v1',
      getToken: () => 'abc',
      fetchFn,
    });

    const result = await client.get('/tickets', {
      query: { page: 2, search: '', status: undefined },
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchFn.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe('https://api.test/v1/tickets?page=2');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('throws ApiError on non-2xx responses', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ message: 'missing' }, 404));
    const client = createHttpClient({ baseUrl: 'https://api.test', fetchFn });

    const error = await client.get('/tickets/1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNotFound).toBe(true);
  });
});
