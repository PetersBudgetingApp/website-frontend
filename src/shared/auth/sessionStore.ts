import type { AppUserState, AuthSession } from '@domain/types';

const REFRESH_TOKEN_KEY = 'budget.refresh_token';

let accessToken: string | null = null;
let authState: AppUserState = { status: 'loading', user: null };

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setAppUserState(nextStatus: AppUserState['status'], nextUser: AuthSession['user'] | null): void {
  if (authState.status === nextStatus && authState.user === nextUser) {
    return;
  }

  authState = {
    status: nextStatus,
    user: nextUser,
  };
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthState(): AppUserState {
  return authState;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthSession(session: AuthSession): void {
  accessToken = session.accessToken;
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  setAppUserState('authenticated', session.user);
}

export function setAccessTokenOnly(nextAccessToken: string): void {
  accessToken = nextAccessToken;
  notify();
}

export function setUserAuthenticated(nextUser: AuthSession['user']): void {
  setAppUserState('authenticated', nextUser);
}

export function setAnonymous(): void {
  accessToken = null;
  setAppUserState('anonymous', null);
}

export function clearSession(): void {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  setAppUserState('anonymous', null);
}
