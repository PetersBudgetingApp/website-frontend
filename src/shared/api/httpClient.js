export class ApiClientError extends Error {
    status;
    timestamp;
    errors;
    constructor(input) {
        super(input.message);
        this.name = 'ApiClientError';
        this.status = input.status;
        this.timestamp = input.timestamp;
        this.errors = input.errors;
    }
}
function normalizeError(status, payload) {
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
        const candidate = payload;
        return new ApiClientError({
            status,
            message: candidate.message ?? 'Unexpected API error',
            timestamp: candidate.timestamp,
            errors: candidate.errors,
        });
    }
    return new ApiClientError({
        status,
        message: `Request failed with status ${status}`,
    });
}
function resolveRequestBaseUrl(baseUrl) {
    if (/^https?:\/\//i.test(baseUrl)) {
        return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
        const normalized = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
        const resolved = new URL(normalized, window.location.origin);
        if (!resolved.pathname.endsWith('/')) {
            resolved.pathname = `${resolved.pathname}/`;
        }
        return resolved.toString();
    }
    return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}
export class HttpClient {
    baseUrl;
    getAccessToken;
    onUnauthorized;
    constructor(params) {
        this.baseUrl = params.baseUrl;
        this.getAccessToken = params.getAccessToken;
    }
    setUnauthorizedHandler(handler) {
        this.onUnauthorized = handler;
    }
    async request(path, options = {}) {
        const method = options.method ?? 'GET';
        const auth = options.auth ?? true;
        const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
        const url = new URL(path, resolveRequestBaseUrl(this.baseUrl));
        if (options.query) {
            Object.entries(options.query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, String(value));
                }
            });
        }
        const headers = new Headers({
            Accept: 'application/json',
        });
        if (options.body !== undefined) {
            headers.set('Content-Type', 'application/json');
        }
        if (auth) {
            const token = this.getAccessToken();
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }
        const response = await fetch(url.toString(), {
            method,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });
        let payload = null;
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            payload = await response.json();
        }
        if (response.status === 401 && auth && retryOnUnauthorized && this.onUnauthorized) {
            const recovered = await this.onUnauthorized();
            if (recovered) {
                return this.request(path, { ...options, retryOnUnauthorized: false });
            }
        }
        if (!response.ok) {
            throw normalizeError(response.status, payload);
        }
        if (options.schema) {
            return options.schema.parse(payload);
        }
        return payload;
    }
}
