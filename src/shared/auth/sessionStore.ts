import type { AppUserState, AuthSession } from '@domain/types';

const REFRESH_TOKEN_KEY = 'budget.refresh_token';

let accessToken: string | null = null;
let user: AuthSession['user'] | null = null;
let status: AppUserState['status'] = 'loading';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthState(): AppUserState {
  return { status, user };
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthSession(session: AuthSession): void {
  accessToken = session.accessToken;
  user = session.user;
  status = 'authenticated';
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  notify();
}

export function setAccessTokenOnly(nextAccessToken: string): void {
  accessToken = nextAccessToken;
  notify();
}

export function setUserAuthenticated(nextUser: AuthSession['user']): void {
  user = nextUser;
  status = 'authenticated';
  notify();
}

export function setAnonymous(): void {
  accessToken = null;
  user = null;
  status = 'anonymous';
  notify();
}

export function clearSession(): void {
  accessToken = null;
  user = null;
  status = 'anonymous';
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notify();
}
