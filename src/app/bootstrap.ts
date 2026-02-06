import { apiClient } from '@shared/api/client';
import { refreshAccessToken } from '@shared/auth/authApi';

let initialized = false;

export function bootstrapApp() {
  if (initialized) {
    return;
  }

  apiClient.setUnauthorizedHandler(async () => refreshAccessToken());
  initialized = true;
}
