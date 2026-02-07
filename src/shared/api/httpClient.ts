import { z } from 'zod';
import type { ApiError } from '@domain/types';

interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  schema?: z.Schema<T>;
  retryOnUnauthorized?: boolean;
}

type UnauthorizedHandler = () => Promise<boolean>;

type AccessTokenGetter = () => string | null;

export class ApiClientError extends Error implements ApiError {
  status: number;
  timestamp?: string;
  errors?: Record<string, string>;

  constructor(input: ApiError) {
    super(input.message);
    this.name = 'ApiClientError';
    this.status = input.status;
    this.timestamp = input.timestamp;
    this.errors = input.errors;
  }
}

function normalizeError(status: number, payload: unknown): ApiClientError {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const candidate = payload as Partial<ApiError>;
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

function resolveRequestBaseUrl(baseUrl: string): string {
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
  private readonly baseUrl: string;
  private readonly getAccessToken: AccessTokenGetter;
  private onUnauthorized?: UnauthorizedHandler;

  constructor(params: { baseUrl: string; getAccessToken: AccessTokenGetter }) {
    this.baseUrl = params.baseUrl;
    this.getAccessToken = params.getAccessToken;
  }

  setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    this.onUnauthorized = handler;
  }

  async request<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
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

    let payload: unknown = null;
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

    return payload as T;
  }
}
