import { z } from 'zod';
import { connectionSchema, syncResultSchema } from '@domain/schemas';
import { apiClient } from '@shared/api/client';

const connectionsSchema = z.array(connectionSchema);

export type ConnectionDto = z.infer<typeof connectionSchema>;
export type SyncResultDto = z.infer<typeof syncResultSchema>;

export async function getConnections() {
  return apiClient.request('connections', {
    schema: connectionsSchema,
  });
}

export async function setupSimpleFinConnection(setupToken: string) {
  return apiClient.request('connections/simplefin/setup', {
    method: 'POST',
    body: { setupToken },
    schema: connectionSchema,
  });
}

export async function syncConnection(id: number) {
  return apiClient.request(`connections/${id}/sync`, {
    method: 'POST',
    schema: syncResultSchema,
  });
}

export async function fullSyncConnection(id: number) {
  return apiClient.request(`connections/${id}/sync/full`, {
    method: 'POST',
    schema: syncResultSchema,
  });
}

export async function deleteConnection(id: number) {
  return apiClient.request<void>(`connections/${id}`, {
    method: 'DELETE',
  });
}
