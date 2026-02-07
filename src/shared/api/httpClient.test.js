import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '@shared/api/httpClient';
describe('HttpClient refresh behavior', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it('retries once after unauthorized when handler recovers', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
        }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        }));
        vi.stubGlobal('fetch', fetchMock);
        const client = new HttpClient({
            baseUrl: 'http://localhost:8080/api/v1',
            getAccessToken: () => 'token-1',
        });
        const handler = vi.fn().mockResolvedValue(true);
        client.setUnauthorizedHandler(handler);
        const response = await client.request('test');
        expect(response.ok).toBe(true);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    it('resolves relative base URL against browser origin', async () => {
        window.history.pushState({}, '', 'http://localhost:3000/register');
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        }));
        vi.stubGlobal('fetch', fetchMock);
        const client = new HttpClient({
            baseUrl: '/api/v1',
            getAccessToken: () => null,
        });
        await client.request('auth/register', {
            method: 'POST',
            auth: false,
            body: { email: 'test@example.com', password: 'password123' },
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/v1/auth/register');
    });
});
