import { HttpClient } from '@shared/api/httpClient';
import { getAccessToken } from '@shared/auth/sessionStore';
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';
export const apiClient = new HttpClient({
    baseUrl,
    getAccessToken,
});
