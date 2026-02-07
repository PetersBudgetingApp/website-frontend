import { useSyncExternalStore } from 'react';
import { getAuthState, subscribe } from '@shared/auth/sessionStore';
export function useAuth() {
    return useSyncExternalStore(subscribe, getAuthState, getAuthState);
}
