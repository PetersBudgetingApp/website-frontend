import { z } from 'zod';
import { authMeSchema, authSessionSchema } from '@domain/schemas';
import type { AuthSession } from '@domain/types';
import { apiClient } from '@shared/api/client';
import { clearSession, getRefreshToken, setAccessTokenOnly, setAnonymous, setAuthSession, setUserAuthenticated } from '@shared/auth/sessionStore';

const authRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function login(email: string, password: string): Promise<AuthSession> {
  const payload = authRequestSchema.parse({ email, password });
  const session = await apiClient.request('auth/login', {
    method: 'POST',
    auth: false,
    body: payload,
    schema: authSessionSchema,
  });
  setAuthSession(session);
  return session;
}

export async function register(email: string, password: string): Promise<AuthSession> {
  const payload = authRequestSchema.parse({ email, password });
  const session = await apiClient.request('auth/register', {
    method: 'POST',
    auth: false,
    body: payload,
    schema: authSessionSchema,
  });
  setAuthSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await apiClient.request('auth/logout', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : undefined,
    });
  } finally {
    clearSession();
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    setAnonymous();
    return false;
  }

  try {
    const session = await apiClient.request('auth/refresh', {
      method: 'POST',
      auth: false,
      body: { refreshToken },
      schema: authSessionSchema,
      retryOnUnauthorized: false,
    });

    setAuthSession(session);
    setAccessTokenOnly(session.accessToken);
    setUserAuthenticated(session.user);
    return true;
  } catch {
    clearSession();
    return false;
  }
}

export async function restoreSession(): Promise<void> {
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    setAnonymous();
    return;
  }

  const me = await apiClient.request('auth/me', {
    method: 'GET',
    schema: authMeSchema,
  });

  setUserAuthenticated(me);
}
