import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '@shared/api/httpClient';

describe('HttpClient refresh behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retries once after unauthorized when handler recovers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const client = new HttpClient({
      baseUrl: 'http://localhost:8080/api/v1',
      getAccessToken: () => 'token-1',
    });

    const handler = vi.fn().mockResolvedValue(true);
    client.setUnauthorizedHandler(handler);

    const response = await client.request<{ ok: boolean }>('test');

    expect(response.ok).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
