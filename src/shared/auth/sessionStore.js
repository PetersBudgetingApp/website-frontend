const REFRESH_TOKEN_KEY = 'budget.refresh_token';
let accessToken = null;
let authState = { status: 'loading', user: null };
const listeners = new Set();
function notify() {
    listeners.forEach((listener) => listener());
}
function setAppUserState(nextStatus, nextUser) {
    if (authState.status === nextStatus && authState.user === nextUser) {
        return;
    }
    authState = {
        status: nextStatus,
        user: nextUser,
    };
    notify();
}
export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
export function getAuthState() {
    return authState;
}
export function getAccessToken() {
    return accessToken;
}
export function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}
export function setAuthSession(session) {
    accessToken = session.accessToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    setAppUserState('authenticated', session.user);
}
export function setAccessTokenOnly(nextAccessToken) {
    accessToken = nextAccessToken;
    notify();
}
export function setUserAuthenticated(nextUser) {
    setAppUserState('authenticated', nextUser);
}
export function setAnonymous() {
    accessToken = null;
    setAppUserState('anonymous', null);
}
export function clearSession() {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAppUserState('anonymous', null);
}
