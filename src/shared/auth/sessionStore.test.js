import { beforeEach, describe, expect, it } from 'vitest';
import { clearSession, getAuthState, setAnonymous, setAuthSession, setUserAuthenticated } from '@shared/auth/sessionStore';
describe('sessionStore', () => {
    beforeEach(() => {
        localStorage.clear();
        clearSession();
    });
    it('returns the same snapshot instance when auth state is unchanged', () => {
        const first = getAuthState();
        const second = getAuthState();
        expect(second).toBe(first);
    });
    it('updates snapshot reference only when auth user state changes', () => {
        const anonymousSnapshot = getAuthState();
        setAuthSession({
            accessToken: 'access-1',
            refreshToken: 'refresh-1',
            tokenType: 'Bearer',
            expiresIn: 3600,
            user: { id: 1, email: 'user@example.com' },
        });
        const authenticatedSnapshot = getAuthState();
        expect(authenticatedSnapshot).not.toBe(anonymousSnapshot);
        expect(authenticatedSnapshot.status).toBe('authenticated');
        setUserAuthenticated(authenticatedSnapshot.user);
        const unchangedSnapshot = getAuthState();
        expect(unchangedSnapshot).toBe(authenticatedSnapshot);
        setAnonymous();
        const nextAnonymousSnapshot = getAuthState();
        expect(nextAnonymousSnapshot).not.toBe(authenticatedSnapshot);
        expect(nextAnonymousSnapshot.status).toBe('anonymous');
    });
});
